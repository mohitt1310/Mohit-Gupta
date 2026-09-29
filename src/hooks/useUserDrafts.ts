import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DraftSummaryItem, getDraftsSummary } from '../utils/draftsUtils';
import { removeDraftFromCloud } from '../services/firestoreSync';

export function useUserDrafts() {
  const { currentUser, dailyReports, weeklyReports, deleteDraftReport, addToast } = useApp();
  const [drafts, setDrafts] = useState<DraftSummaryItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const scan = useCallback(() => {
    if (!currentUser) {
      setDrafts([]);
      return;
    }
    const list = getDraftsSummary(currentUser, dailyReports, weeklyReports);
    setDrafts(list);
  }, [currentUser, dailyReports, weeklyReports]);

  // Initial and reactive scan on dependencies
  useEffect(() => {
    scan();
  }, [scan]);

  // Listen to custom cross-component draft events and storage events
  useEffect(() => {
    const handleUpdate = () => {
      scan();
    };

    window.addEventListener('trms-drafts-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('trms-drafts-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [scan]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    scan();
    setTimeout(() => setIsRefreshing(false), 400);
  }, [scan]);

  const discardDraftItem = useCallback(
    async (item: DraftSummaryItem) => {
      // 1. Remove from localStorage and cloud if present
      if (item.storageKey) {
        try {
          localStorage.removeItem(item.storageKey);
        } catch (e) {
          console.error('Error removing local draft key:', e);
        }
        try {
          await removeDraftFromCloud(item.storageKey);
        } catch (e) {
          console.warn('Error removing cloud draft key:', e);
        }
      }

      // 2. Remove from database/state if saved draft
      if (item.reportId && deleteDraftReport) {
        try {
          await deleteDraftReport(item.reportId, item.type);
        } catch (e) {
          console.error('Error removing saved draft:', e);
        }
      }

      // 3. Dispatch update event
      window.dispatchEvent(
        new CustomEvent('trms-drafts-updated', {
          detail: { key: item.storageKey, reportId: item.reportId }
        })
      );
      addToast('info', `${item.type === 'DAILY' ? 'Daily' : 'Weekly'} report draft discarded.`);
      scan();
    },
    [deleteDraftReport, addToast, scan]
  );

  const discardAll = useCallback(async () => {
    for (const item of drafts) {
      if (item.storageKey) {
        try {
          localStorage.removeItem(item.storageKey);
        } catch (e) {
          // ignore
        }
        try {
          await removeDraftFromCloud(item.storageKey);
        } catch (e) {
          // ignore
        }
      }
      if (item.reportId && deleteDraftReport) {
        try {
          await deleteDraftReport(item.reportId, item.type);
        } catch (e) {
          // ignore
        }
      }
    }

    window.dispatchEvent(new CustomEvent('trms-drafts-updated'));
    addToast('info', 'All in-progress drafts have been discarded.');
    scan();
  }, [drafts, deleteDraftReport, addToast, scan]);

  const dailyCount = useMemo(() => drafts.filter(d => d.type === 'DAILY').length, [drafts]);
  const weeklyCount = useMemo(() => drafts.filter(d => d.type === 'WEEKLY').length, [drafts]);

  return {
    drafts,
    draftCount: drafts.length,
    dailyCount,
    weeklyCount,
    isRefreshing,
    refresh,
    discardDraftItem,
    discardAll
  };
}
