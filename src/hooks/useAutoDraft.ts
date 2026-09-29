import { useState, useEffect, useRef, useCallback } from 'react';
import { syncDraftToCloud, fetchDraftFromCloud, removeDraftFromCloud } from '../services/firestoreSync';

export interface StoredDraft<T> {
  timestamp: number;
  data: T;
  source?: 'localStorage' | 'firestore';
}

export interface UseAutoDraftOptions<T> {
  key: string;
  formData: T;
  intervalMs?: number; // default: 30000 (30 seconds)
  hasMeaningfulContent: (data: T) => boolean;
  onRestore: (data: T) => void;
  enabled?: boolean;
  userId?: string;
  reportType?: 'DAILY' | 'WEEKLY';
  reportId?: string;
  syncWithFirestore?: boolean;
}

export interface UseAutoDraftReturn<T> {
  hasRecoverableDraft: boolean;
  draftTimestamp: number | null;
  draftData: T | null;
  draftSource: 'localStorage' | 'firestore' | 'both' | null;
  lastSaved: Date | null;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  secondsUntilNextSave: number;
  saveDraft: (manual?: boolean) => Promise<void>;
  restoreDraft: () => void;
  discardDraft: () => Promise<void>;
  clearDraft: () => Promise<void>;
}

export function useAutoDraft<T>({
  key,
  formData,
  intervalMs = 30000,
  hasMeaningfulContent,
  onRestore,
  enabled = true,
  userId,
  reportType = 'DAILY',
  reportId,
  syncWithFirestore = true,
}: UseAutoDraftOptions<T>): UseAutoDraftReturn<T> {
  const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<number | null>(null);
  const [draftData, setDraftData] = useState<T | null>(null);
  const [draftSource, setDraftSource] = useState<'localStorage' | 'firestore' | 'both' | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [secondsUntilNextSave, setSecondsUntilNextSave] = useState<number>(Math.round(intervalMs / 1000));

  // Refs to avoid stale closures in intervals and callbacks
  const formDataRef = useRef<T>(formData);
  formDataRef.current = formData;

  const keyRef = useRef<string>(key);
  keyRef.current = key;

  const userIdRef = useRef<string | undefined>(userId);
  userIdRef.current = userId;

  const reportTypeRef = useRef<'DAILY' | 'WEEKLY'>(reportType);
  reportTypeRef.current = reportType;

  const reportIdRef = useRef<string | undefined>(reportId);
  reportIdRef.current = reportId;

  const syncWithFirestoreRef = useRef<boolean>(syncWithFirestore);
  syncWithFirestoreRef.current = syncWithFirestore;

  const hasMeaningfulContentRef = useRef(hasMeaningfulContent);
  hasMeaningfulContentRef.current = hasMeaningfulContent;

  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  // 1. Initial draft discovery (checks localStorage and Firestore)
  useEffect(() => {
    if (!enabled) return;
    let isMounted = true;

    async function checkExistingDrafts() {
      let localDraft: StoredDraft<T> | null = null;
      let cloudDraft: StoredDraft<T> | null = null;

      // Check localStorage first
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored) as StoredDraft<T>;
          if (parsed && parsed.data && hasMeaningfulContentRef.current(parsed.data)) {
            localDraft = parsed;
          }
        }
      } catch (err) {
        console.warn('Could not read draft from localStorage:', err);
      }

      // Check Firestore cloud backup if enabled
      if (syncWithFirestore) {
        try {
          const remote = await fetchDraftFromCloud<T>(key);
          if (remote && remote.data && hasMeaningfulContentRef.current(remote.data)) {
            cloudDraft = {
              timestamp: remote.timestamp,
              data: remote.data,
              source: 'firestore',
            };
          }
        } catch (err) {
          console.warn('Could not check remote draft from Firestore:', err);
        }
      }

      if (!isMounted) return;

      // Determine the best draft to offer for recovery
      let bestDraft: StoredDraft<T> | null = null;
      let source: 'localStorage' | 'firestore' | 'both' | null = null;

      if (localDraft && cloudDraft) {
        source = 'both';
        bestDraft = cloudDraft.timestamp > localDraft.timestamp ? cloudDraft : localDraft;
      } else if (localDraft) {
        source = 'localStorage';
        bestDraft = localDraft;
      } else if (cloudDraft) {
        source = 'firestore';
        bestDraft = cloudDraft;
      }

      if (bestDraft) {
        // Compare with current form data so we only prompt if there is unsaved differences
        const currentStr = JSON.stringify(formDataRef.current);
        const savedStr = JSON.stringify(bestDraft.data);
        if (currentStr !== savedStr) {
          setHasRecoverableDraft(true);
          setDraftTimestamp(bestDraft.timestamp);
          setDraftData(bestDraft.data);
          setDraftSource(source);
        }
      }
    }

    checkExistingDrafts();

    return () => {
      isMounted = false;
    };
  }, [key, enabled, syncWithFirestore]);

  // 2. Core save function (persists to localStorage + Firestore)
  const saveDraft = useCallback(async (_manual: boolean = false) => {
    if (!enabled) return;
    const current = formDataRef.current;
    if (!hasMeaningfulContentRef.current(current)) return;

    try {
      setIsSaving(true);
      setSaveStatus('saving');
      const now = Date.now();

      // 2a. Synchronous local storage persistence
      const payload: StoredDraft<T> = {
        timestamp: now,
        data: current,
        source: 'localStorage',
      };
      localStorage.setItem(keyRef.current, JSON.stringify(payload));

      // 2b. Asynchronous Firestore cloud persistence
      if (syncWithFirestoreRef.current && userIdRef.current) {
        await syncDraftToCloud({
          id: keyRef.current,
          userId: userIdRef.current,
          reportType: reportTypeRef.current,
          reportId: reportIdRef.current,
          timestamp: now,
          data: current,
          updatedAt: new Date(now).toISOString(),
        });
      }

      setLastSaved(new Date(now));
      setSaveStatus('saved');
      setSecondsUntilNextSave(Math.round(intervalMs / 1000));
      window.dispatchEvent(
        new CustomEvent('trms-drafts-updated', { detail: { key: keyRef.current } })
      );
    } catch (err) {
      console.error('Failed to auto-save report draft:', err);
      setSaveStatus('error');
    } finally {
      setTimeout(() => {
        setIsSaving(false);
      }, 600);
    }
  }, [enabled, intervalMs]);

  // 3. Debounced save when form fields change (after 1.5s idle)
  useEffect(() => {
    if (!enabled) return;
    if (!hasMeaningfulContentRef.current(formData)) return;

    const debounceTimer = setTimeout(() => {
      saveDraft(false);
    }, 1500);

    return () => clearTimeout(debounceTimer);
  }, [formData, saveDraft, enabled]);

  // 4. Strict 30-Second Interval Timer & 1s countdown feedback
  useEffect(() => {
    if (!enabled) return;

    // Tick every second to drive the 30-second countdown indicator
    const tickInterval = setInterval(() => {
      setSecondsUntilNextSave((prev) => {
        if (prev <= 1) {
          // Trigger the 30-second auto-save
          saveDraft(false);
          return Math.round(intervalMs / 1000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tickInterval);
  }, [intervalMs, saveDraft, enabled]);

  // 5. Save on component unmount (SPA route change)
  useEffect(() => {
    return () => {
      if (!enabled) return;
      const current = formDataRef.current;
      if (hasMeaningfulContentRef.current(current)) {
        try {
          const now = Date.now();
          const payload: StoredDraft<T> = {
            timestamp: now,
            data: current,
            source: 'localStorage',
          };
          localStorage.setItem(keyRef.current, JSON.stringify(payload));
          if (syncWithFirestoreRef.current && userIdRef.current) {
            syncDraftToCloud({
              id: keyRef.current,
              userId: userIdRef.current,
              reportType: reportTypeRef.current,
              reportId: reportIdRef.current,
              timestamp: now,
              data: current,
              updatedAt: new Date(now).toISOString(),
            });
          }
          window.dispatchEvent(
            new CustomEvent('trms-drafts-updated', { detail: { key: keyRef.current } })
          );
        } catch {
          // ignore unmount errors
        }
      }
    };
  }, [enabled]);

  // 6. Save on window beforeunload (browser tab close or reload)
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      const current = formDataRef.current;
      if (hasMeaningfulContentRef.current(current)) {
        try {
          const payload: StoredDraft<T> = {
            timestamp: Date.now(),
            data: current,
            source: 'localStorage',
          };
          localStorage.setItem(keyRef.current, JSON.stringify(payload));
        } catch {
          // ignore beforeunload errors
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled]);

  // 7. Restore draft
  const restoreDraft = useCallback(() => {
    if (draftData) {
      onRestoreRef.current(draftData);
      setHasRecoverableDraft(false);
      setDraftData(null);
      setLastSaved(new Date());
    }
  }, [draftData]);

  // 8. Discard draft (removes from both localStorage and Firestore)
  const discardDraft = useCallback(async () => {
    const k = keyRef.current;
    try {
      localStorage.removeItem(k);
    } catch (err) {
      console.error('Failed to remove draft from localStorage:', err);
    }

    if (syncWithFirestoreRef.current) {
      try {
        await removeDraftFromCloud(k);
      } catch (err) {
        console.warn('Failed to remove draft from Firestore:', err);
      }
    }

    setHasRecoverableDraft(false);
    setDraftData(null);
    setDraftTimestamp(null);
    setDraftSource(null);
    setLastSaved(null);

    window.dispatchEvent(
      new CustomEvent('trms-drafts-updated', { detail: { key: k } })
    );
  }, []);

  // 9. Clear draft upon final submission
  const clearDraft = useCallback(async () => {
    const k = keyRef.current;
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }

    if (syncWithFirestoreRef.current) {
      try {
        await removeDraftFromCloud(k);
      } catch {
        // ignore
      }
    }

    setHasRecoverableDraft(false);
    setDraftData(null);
    setDraftTimestamp(null);
    setDraftSource(null);
    setLastSaved(null);

    window.dispatchEvent(
      new CustomEvent('trms-drafts-updated', { detail: { key: k } })
    );
  }, []);

  return {
    hasRecoverableDraft,
    draftTimestamp,
    draftData,
    draftSource,
    lastSaved,
    isSaving,
    saveStatus,
    secondsUntilNextSave,
    saveDraft,
    restoreDraft,
    discardDraft,
    clearDraft,
  };
}
