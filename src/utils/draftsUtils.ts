import { User, DailyReport, WeeklyReport } from '../types';

export interface DraftSummaryItem {
  id: string;
  type: 'DAILY' | 'WEEKLY';
  source: 'LOCAL_AUTO_SAVE' | 'SAVED_DRAFT';
  storageKey?: string;
  reportId?: string;
  timestamp: number;
  title: string;
  subtitle: string;
  workAreaOrDept: string;
  previewText: string;
  fieldsFilledCount: number;
  totalKeyFields: number;
  reportObj: DailyReport | WeeklyReport;
}

export function formatDraftTimeAgo(timestamp: number): string {
  if (!timestamp) return 'Recently';
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));

  if (diffSec < 45) return 'Just now';
  if (diffSec < 90) return '1 min ago';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function getDraftsSummary(
  currentUser: User | null,
  dailyReports: DailyReport[],
  weeklyReports: WeeklyReport[]
): DraftSummaryItem[] {
  if (!currentUser || typeof window === 'undefined') return [];

  const list: DraftSummaryItem[] = [];
  const processedDailyIds = new Set<string>();
  const processedWeeklyIds = new Set<string>();

  // 1. Scan localStorage auto-saved drafts
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Match daily drafts (both standard and PPT format keys)
      if (
        (key.startsWith(`trms_draft_daily_${currentUser.id}_`) ||
          key.startsWith(`trms_draft_daily_ppt_${currentUser.id}_`)) &&
        key.includes(currentUser.id)
      ) {
        let suffix = '';
        if (key.startsWith(`trms_draft_daily_ppt_${currentUser.id}_`)) {
          suffix = key.replace(`trms_draft_daily_ppt_${currentUser.id}_`, '');
        } else {
          suffix = key.replace(`trms_draft_daily_${currentUser.id}_`, '');
        }

        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          const data = parsed.data || {};
          const hasContent = Boolean(
            data.processValueAdded?.trim() ||
            data.inputDept?.trim() ||
            data.outputNextDept?.trim() ||
            data.standards?.trim() ||
            data.safetyStandards?.trim() ||
            data.chronicProblem1?.trim() ||
            data.backOfPageNotes?.trim() ||
            data.topicActivity?.trim() ||
            data.trainingWorkArea?.trim() ||
            data.workDescription?.trim() ||
            data.learningOutcome?.trim() ||
            data.safetyObservations?.trim() ||
            data.remarks?.trim()
          );

          if (hasContent) {
            const filledFields = [
              data.date,
              data.department,
              data.subDepartment,
              data.inputDept,
              data.processValueAdded || data.workDescription,
              data.outputNextDept || data.learningOutcome,
              data.standards,
              data.safetyStandards || data.safetyObservations,
              data.chronicProblem1
            ].filter(v => Boolean(v && String(v).trim())).length;

            const repId = suffix === 'new' ? undefined : suffix;
            if (repId) processedDailyIds.add(repId);

            const title =
              data.subDepartment?.trim() ||
              data.topicActivity?.trim() ||
              data.trainingWorkArea?.trim() ||
              data.department ||
              'Daily Activity Report';

            const preview =
              data.processValueAdded?.trim() ||
              data.workDescription?.trim() ||
              data.learningOutcome?.trim() ||
              data.outputNextDept?.trim() ||
              data.chronicProblem1?.trim() ||
              'In-progress daily logbook notes...';

            const reportObj: DailyReport = {
              id: repId || '',
              userId: currentUser.id,
              employeeId: currentUser.employeeId,
              userName: currentUser.name,
              nameOfGet: data.nameOfGet || currentUser.name,
              department: data.department || currentUser.department || 'Production',
              subDepartment: data.subDepartment || '',
              designation: currentUser.designation,
              reportingManager: currentUser.reportingManager,
              nameOfHod: data.nameOfHod || currentUser.reportingManager || '',
              staffMet1: data.staffMet1 || '',
              staffMet2: data.staffMet2 || '',
              date: data.date || new Date().toISOString().split('T')[0],
              inputDept: data.inputDept || '',
              processValueAdded: data.processValueAdded || data.workDescription || '',
              outputNextDept: data.outputNextDept || data.learningOutcome || '',
              standards: data.standards || '',
              safetyStandards: data.safetyStandards || data.safetyObservations || '',
              chronicProblem1: data.chronicProblem1 || '',
              chronicProblem2: data.chronicProblem2 || '',
              chronicProblem3: data.chronicProblem3 || '',
              backOfPageNotes: data.backOfPageNotes || data.remarks || '',
              trainingWorkArea: data.trainingWorkArea || data.subDepartment || data.department || 'Production',
              topicActivity: data.topicActivity || title,
              workDescription: data.workDescription || data.processValueAdded || '',
              learningOutcome: data.learningOutcome || data.outputNextDept || '',
              toolsEquipmentUsed: data.toolsEquipmentUsed || '',
              safetyObservations: data.safetyObservations || data.safetyStandards || '',
              remarks: data.remarks || data.backOfPageNotes || '',
              status: 'DRAFT',
              createdAt: new Date(parsed.timestamp || Date.now()).toISOString(),
              submittedAt: new Date(parsed.timestamp || Date.now()).toISOString(),
              updatedAt: new Date(parsed.timestamp || Date.now()).toISOString()
            };

            list.push({
              id: `local-daily-${suffix}`,
              type: 'DAILY',
              source: 'LOCAL_AUTO_SAVE',
              storageKey: key,
              reportId: repId,
              timestamp: parsed.timestamp || Date.now(),
              title,
              subtitle: data.date ? `For Date: ${data.date}` : 'Draft Daily Entry',
              workAreaOrDept: data.subDepartment
                ? `${data.department || 'Production'} • ${data.subDepartment}`
                : (data.department || 'Production'),
              previewText: preview,
              fieldsFilledCount: Math.min(filledFields, 8),
              totalKeyFields: 8,
              reportObj
            });
          }
        } catch (e) {
          // ignore corrupted local JSON
        }
      } else if (
        key.startsWith(`trms_draft_weekly_${currentUser.id}_`) &&
        key.includes(currentUser.id)
      ) {
        const suffix = key.replace(`trms_draft_weekly_${currentUser.id}_`, '');
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          const data = parsed.data || {};
          const hasContent = Boolean(
            data.assignedProjectDept?.trim() ||
            data.majorLearnings?.trim() ||
            data.challengesFaced?.trim() ||
            data.technicalSkillsAcquired?.trim() ||
            data.classroomTrainingSummary?.trim() ||
            data.shopFloorTrainingSummary?.trim() ||
            data.planForNextWeek?.trim() ||
            (data.dailySummary && data.dailySummary.some((d: any) => d.activity?.trim()))
          );

          if (hasContent) {
            const weekStartVal = data.weekStart || data.weekStartDate || '';
            const weekEndVal = data.weekEnd || data.weekEndDate || '';
            const filledFields = [
              weekStartVal,
              data.assignedProjectDept,
              data.majorLearnings,
              data.technicalSkillsAcquired,
              data.challengesFaced,
              data.planForNextWeek,
              data.classroomTrainingSummary || data.shopFloorTrainingSummary
            ].filter(v => Boolean(v && String(v).trim())).length;

            const repId = suffix === 'new' ? undefined : suffix;
            if (repId) processedWeeklyIds.add(repId);

            const title =
              data.assignedProjectDept?.trim() ||
              (weekStartVal ? `Week ${data.weekNumber || ''} (${weekStartVal})` : 'Weekly Synthesis Report');

            const preview =
              data.majorLearnings?.trim() ||
              data.classroomTrainingSummary?.trim() ||
              data.shopFloorTrainingSummary?.trim() ||
              data.challengesFaced?.trim() ||
              data.planForNextWeek?.trim() ||
              'Weekly summary in progress...';

            const reportObj: WeeklyReport = {
              id: repId || '',
              userId: currentUser.id,
              employeeId: currentUser.employeeId,
              userName: currentUser.name,
              department: data.department || currentUser.department || 'Production',
              subDepartment: data.subDepartment || '',
              designation: currentUser.designation,
              reportingManager: currentUser.reportingManager,
              weekNumber: data.weekNumber || 1,
              weekStart: weekStartVal || new Date().toISOString().split('T')[0],
              weekEnd: weekEndVal || new Date().toISOString().split('T')[0],
              assignedProjectDept: data.assignedProjectDept || currentUser.department || 'Production',
              nameOfStudentTrainee: data.nameOfStudentTrainee || currentUser.name,
              daysPresent: data.daysPresent || 6,
              classroomTrainingSummary: data.classroomTrainingSummary || '',
              shopFloorTrainingSummary: data.shopFloorTrainingSummary || '',
              projectSummaryA: data.projectSummaryA || '',
              projectSummaryB: data.projectSummaryB || '',
              selfLearningSummary: data.selfLearningSummary || '',
              suggestion: data.suggestion || '',
              dailySummary: data.dailySummary || [],
              majorLearnings: data.majorLearnings || '',
              technicalSkillsAcquired: data.technicalSkillsAcquired || '',
              challengesFaced: data.challengesFaced || '',
              solutionsImplemented: data.solutionsImplemented || '',
              planForNextWeek: data.planForNextWeek || '',
              traineeSelfAssessment: data.traineeSelfAssessment || 'Met Expectations',
              remarks: data.remarks || '',
              status: 'DRAFT',
              createdAt: new Date(parsed.timestamp || Date.now()).toISOString(),
              submittedAt: new Date(parsed.timestamp || Date.now()).toISOString(),
              updatedAt: new Date(parsed.timestamp || Date.now()).toISOString()
            };

            list.push({
              id: `local-weekly-${suffix}`,
              type: 'WEEKLY',
              source: 'LOCAL_AUTO_SAVE',
              storageKey: key,
              reportId: repId,
              timestamp: parsed.timestamp || Date.now(),
              title,
              subtitle: weekStartVal ? `${weekStartVal} to ${weekEndVal || 'end'}` : 'Draft Weekly Report',
              workAreaOrDept: data.subDepartment
                ? `${data.assignedProjectDept || 'Production'} • ${data.subDepartment}`
                : (data.assignedProjectDept || 'Department Summary'),
              previewText: preview,
              fieldsFilledCount: Math.min(filledFields, 7),
              totalKeyFields: 7,
              reportObj
            });
          }
        } catch (e) {
          // ignore corrupted local JSON
        }
      }
    }
  } catch (err) {
    console.error('Error scanning localStorage drafts:', err);
  }

  // 2. Also check TRMS state for saved drafts with status === 'DRAFT'
  const myDailyDrafts = dailyReports.filter(
    r => r.userId === currentUser.id && r.status === 'DRAFT'
  );
  myDailyDrafts.forEach(report => {
    if (!processedDailyIds.has(report.id)) {
      list.push({
        id: `saved-daily-${report.id}`,
        type: 'DAILY',
        source: 'SAVED_DRAFT',
        reportId: report.id,
        timestamp: new Date(report.updatedAt || report.createdAt || report.submittedAt).getTime(),
        title: report.topicActivity || report.trainingWorkArea || `Daily Report ${report.id}`,
        subtitle: `For Date: ${report.date}`,
        workAreaOrDept: report.subDepartment
          ? `${report.department} • ${report.subDepartment}`
          : (report.trainingWorkArea || report.department),
        previewText: report.processValueAdded || report.workDescription || report.learningOutcome || 'Saved draft report',
        fieldsFilledCount: 6,
        totalKeyFields: 8,
        reportObj: report
      });
    }
  });

  const myWeeklyDrafts = weeklyReports.filter(
    r => r.userId === currentUser.id && r.status === 'DRAFT'
  );
  myWeeklyDrafts.forEach(report => {
    if (!processedWeeklyIds.has(report.id)) {
      const start = report.weekStart || (report as any).weekStartDate || '';
      const end = report.weekEnd || (report as any).weekEndDate || '';
      list.push({
        id: `saved-weekly-${report.id}`,
        type: 'WEEKLY',
        source: 'SAVED_DRAFT',
        reportId: report.id,
        timestamp: new Date(report.updatedAt || report.createdAt || report.submittedAt).getTime(),
        title: report.assignedProjectDept || `Week ${report.weekNumber}: ${start}`,
        subtitle: start ? `${start} to ${end}` : `Week ${report.weekNumber}`,
        workAreaOrDept: report.subDepartment
          ? `${report.department} • ${report.subDepartment}`
          : (report.assignedProjectDept || report.department),
        previewText: report.majorLearnings || report.classroomTrainingSummary || report.challengesFaced || 'Saved weekly draft report',
        fieldsFilledCount: 6,
        totalKeyFields: 7,
        reportObj: report
      });
    }
  });

  // Sort descending by most recent
  list.sort((a, b) => b.timestamp - a.timestamp);

  return list;
}
