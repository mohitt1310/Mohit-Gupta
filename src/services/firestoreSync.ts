import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, DailyReport, WeeklyReport } from '../types';

export interface FirestoreSyncListeners {
  onUsersUpdate?: (users: User[]) => void;
  onDailyReportsUpdate?: (reports: DailyReport[]) => void;
  onWeeklyReportsUpdate?: (reports: WeeklyReport[]) => void;
}

// Subscribe to real-time updates across both Deployed and AI Studio environments
export function subscribeToSharedCloudData(listeners: FirestoreSyncListeners): () => void {
  const unsubscribers: Array<() => void> = [];

  try {
    // 1. Users real-time listener
    const usersCol = collection(db, 'users');
    const unsubUsers = onSnapshot(usersCol, (snapshot) => {
      if (!snapshot.empty && listeners.onUsersUpdate) {
        const fetched: User[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push(docSnap.data() as User);
        });
        listeners.onUsersUpdate(fetched);
      }
    }, (err) => {
      console.warn('Firestore users listener error:', err);
    });
    unsubscribers.push(unsubUsers);

    // 2. Daily reports real-time listener
    const dailyCol = collection(db, 'dailyReports');
    const unsubDaily = onSnapshot(dailyCol, (snapshot) => {
      if (!snapshot.empty && listeners.onDailyReportsUpdate) {
        const fetched: DailyReport[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push(docSnap.data() as DailyReport);
        });
        // Sort descending by date
        fetched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        listeners.onDailyReportsUpdate(fetched);
      }
    }, (err) => {
      console.warn('Firestore dailyReports listener error:', err);
    });
    unsubscribers.push(unsubDaily);

    // 3. Weekly reports real-time listener
    const weeklyCol = collection(db, 'weeklyReports');
    const unsubWeekly = onSnapshot(weeklyCol, (snapshot) => {
      if (!snapshot.empty && listeners.onWeeklyReportsUpdate) {
        const fetched: WeeklyReport[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push(docSnap.data() as WeeklyReport);
        });
        // Sort descending by week start date
        fetched.sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime());
        listeners.onWeeklyReportsUpdate(fetched);
      }
    }, (err) => {
      console.warn('Firestore weeklyReports listener error:', err);
    });
    unsubscribers.push(unsubWeekly);
  } catch (err) {
    console.error('Failed to attach Firestore listeners:', err);
  }

  return () => {
    unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch {}
    });
  };
}

// Purge demo data from cloud database (removes all mock reports and dummy demo accounts)
export async function purgeDemoDataFromCloud(): Promise<void> {
  try {
    const demoUserIds = new Set([
      'USR-DET-002', 'USR-GET-003', 'USR-DET-004', 'USR-GET-005', 'USR-GET-006', 'USR-HR-007'
    ]);
    const demoUserEmails = new Set([
      'det1@company.com', 'rohan.m@company.com', 'kavita.s@company.com',
      'manish.g@company.com', 'neha.r@company.com', 'hr1@company.com'
    ]);

    // 1. Delete demo users
    const usersCol = collection(db, 'users');
    const usersSnap = await getDocs(usersCol);
    for (const d of usersSnap.docs) {
      const data = d.data();
      if (demoUserIds.has(d.id) || (data.email && demoUserEmails.has(data.email.toLowerCase()))) {
        await deleteDoc(d.ref);
      }
    }

    // 2. Delete demo daily reports
    const dailyCol = collection(db, 'dailyReports');
    const dailySnap = await getDocs(dailyCol);
    for (const d of dailySnap.docs) {
      const reportId = d.id;
      // Demo report format: DR-2026-0001 to DR-2026-0028
      if (/^DR-2026-00(0[1-9]|1[0-9]|2[0-8])$/.test(reportId) || demoUserEmails.has(d.data().userEmail?.toLowerCase?.())) {
        await deleteDoc(d.ref);
      }
    }

    // 3. Delete demo weekly reports
    const weeklyCol = collection(db, 'weeklyReports');
    const weeklySnap = await getDocs(weeklyCol);
    for (const d of weeklySnap.docs) {
      const reportId = d.id;
      if (reportId === 'WR-2026-0001' || reportId === 'WR-2026-0002') {
        await deleteDoc(d.ref);
      }
    }
  } catch (err) {
    console.warn('Notice while purging demo data from Firestore:', err);
  }
}

// Seed existing legitimate users to Firestore if cloud collection is currently empty
export async function seedCloudDatabaseIfNeeded(
  initialUsers: User[],
  initialDaily: DailyReport[],
  initialWeekly: WeeklyReport[]
): Promise<void> {
  try {
    // Purge any lingering demo data first
    await purgeDemoDataFromCloud();

    const usersCol = collection(db, 'users');
    const usersSnap = await getDocs(usersCol);

    if (usersSnap.empty && initialUsers.length > 0) {
      console.log('Syncing legitimate system users into shared Firestore database...');
      const batch = writeBatch(db);
      for (const u of initialUsers) {
        if (!u.id) continue;
        const ref = doc(db, 'users', u.id);
        batch.set(ref, { ...u, updatedAt: new Date().toISOString() });
      }
      await batch.commit();
    }
  } catch (err) {
    console.warn('Firestore bootstrap notice:', err);
  }
}

// Single-record mutation operations with cloud synchronization
export async function syncUserToCloud(user: User): Promise<void> {
  try {
    const ref = doc(db, 'users', user.id);
    await setDoc(ref, { ...user, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Could not sync user to Firestore:', err);
  }
}

export async function removeUserFromCloud(userId: string): Promise<void> {
  try {
    const ref = doc(db, 'users', userId);
    await deleteDoc(ref);
  } catch (err) {
    console.warn('Could not delete user from Firestore:', err);
  }
}

export async function syncDailyReportToCloud(report: DailyReport): Promise<void> {
  try {
    const ref = doc(db, 'dailyReports', report.id);
    await setDoc(ref, { ...report, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Could not sync daily report to Firestore:', err);
  }
}

export async function removeDailyReportFromCloud(reportId: string): Promise<void> {
  try {
    const ref = doc(db, 'dailyReports', reportId);
    await deleteDoc(ref);
  } catch (err) {
    console.warn('Could not delete daily report from Firestore:', err);
  }
}

export async function syncWeeklyReportToCloud(report: WeeklyReport): Promise<void> {
  try {
    const ref = doc(db, 'weeklyReports', report.id);
    await setDoc(ref, { ...report, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Could not sync weekly report to Firestore:', err);
  }
}

export async function removeWeeklyReportFromCloud(reportId: string): Promise<void> {
  try {
    const ref = doc(db, 'weeklyReports', reportId);
    await deleteDoc(ref);
  } catch (err) {
    console.warn('Could not delete weekly report from Firestore:', err);
  }
}

// In-progress Form Draft Persistence (Dual Local + Firestore Cloud Auto-Save)
export interface FormDraftPayload<T = any> {
  id: string; // Storage key, e.g. trms_draft_daily_ppt_USR-001_new
  userId: string;
  reportType: 'DAILY' | 'WEEKLY';
  reportId?: string;
  timestamp: number;
  data: T;
  updatedAt: string;
}

export async function syncDraftToCloud(draft: FormDraftPayload): Promise<void> {
  try {
    if (!draft.id || !draft.userId) return;
    const safeDocId = draft.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const ref = doc(db, 'formDrafts', safeDocId);
    await setDoc(ref, {
      ...draft,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Notice while auto-saving draft to Firestore:', err);
  }
}

export async function fetchDraftFromCloud<T = any>(draftKey: string): Promise<FormDraftPayload<T> | null> {
  try {
    if (!draftKey) return null;
    const safeDocId = draftKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    const ref = doc(db, 'formDrafts', safeDocId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as FormDraftPayload<T>;
    }
    return null;
  } catch (err) {
    console.warn('Notice while fetching draft from Firestore:', err);
    return null;
  }
}

export async function removeDraftFromCloud(draftKey: string): Promise<void> {
  try {
    if (!draftKey) return;
    const safeDocId = draftKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    const ref = doc(db, 'formDrafts', safeDocId);
    await deleteDoc(ref);
  } catch (err) {
    console.warn('Notice while deleting draft from Firestore:', err);
  }
}

