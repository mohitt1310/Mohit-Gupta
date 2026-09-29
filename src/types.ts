export type UserRole = 'ADMIN' | 'GET' | 'DET' | 'USER';

export type UserStatus = 'ACTIVE' | 'DISABLED';

export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER REVIEW' | 'REVIEWED';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  password?: string;
  department: string;
  subDepartment?: string;
  designation: string;
  reportingManager: string;
  joiningDate: string;
  role: UserRole;
  status: UserStatus;
  createdDate: string;
  phone?: string;
  isActive?: boolean;
}

export interface DailyReport {
  id: string; // e.g. DR-2026-0001
  userId: string;
  employeeId: string;
  userName: string; // Name of GET / Trainee Name
  nameOfGet?: string; // Explicit field for Name of GET
  department: string; // Today's Department
  subDepartment?: string; // Department Sub Section
  designation: string;
  reportingManager?: string;
  nameOfHod?: string; // Name of HOD
  staffMet1?: string; // Name of sub section staff met (1)
  staffMet2?: string; // Name of sub section staff met (2)
  date: string; // Date (YYYY-MM-DD)

  // PPT Format Core Fields
  inputDept: string; // Input (for Today's deptt.)
  processValueAdded: string; // Process (value added by this deptt.)
  outputNextDept: string; // Output (final output to next deptt.)
  standards: string; // IS standard & Global standards (for this deptt's process)
  safetyStandards: string; // Safety standards (for this deptt's)
  chronicProblem1?: string; // Chronic problems /challenges/bottlenecks 1
  chronicProblem2?: string; // Chronic problems /challenges/bottlenecks 2
  chronicProblem3?: string; // Chronic problems /challenges/bottlenecks 3
  backOfPageNotes?: string; // Note: if there is less space then you can use at the back of the page

  // Legacy/Compatibility fields
  trainingWorkArea?: string;
  topicActivity?: string;
  workDescription?: string;
  learningOutcome?: string;
  toolsEquipmentUsed?: string;
  safetyObservations?: string;
  challengesFaced?: string;
  bottlenecks?: string;
  remarks?: string;
  hours?: number;

  status: ReportStatus;
  adminRemark?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  createdAt: string;
  submittedAt: string;
  updatedAt: string;
  syncStatus?: 'SYNCED' | 'QUEUED' | 'LOCAL';
}

export interface WeeklyDayEntry {
  day: string; // Monday, Tuesday, etc.
  date: string;
  activity: string;
  hours: number;
}

export interface WeeklyReport {
  id: string; // e.g. WR-2026-0001
  userId: string;
  employeeId: string;
  userName: string;
  department: string;
  subDepartment?: string;
  designation: string;
  reportingManager?: string;
  weekNumber: number;
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  assignedProjectDept?: string;

  // Authentic Weekly Training Report Form Fields (matching paper sheet)
  nameOfStudentTrainee?: string; // • Name of student trainee/GET
  daysPresent?: number | string; // • Days present (in this week)
  classroomTrainingSummary?: string; // • Classroom training summary
  shopFloorTrainingSummary?: string; // • Shop floor training summary
  projectSummaryA?: string; // • Projects summary (a)
  projectSummaryB?: string; // • Projects summary (b)
  selfLearningSummary?: string; // • Self-learning summary
  suggestion?: string; // • Suggestion
  traineeSignature?: string; // Signature of Trainee/GET
  backOfPageNotes?: string; // Note: if there is less space than you can use at the back of the page

  // Extended / Supplementary Fields
  dailySummary?: WeeklyDayEntry[];
  majorLearnings?: string;
  technicalSkillsAcquired?: string;
  challengesFaced?: string;
  solutionsImplemented?: string;
  planForNextWeek?: string;
  traineeSelfAssessment?: 'Exceptional' | 'Exceeded Expectations' | 'Met Expectations' | 'Needs Improvement';
  remarks?: string;
  status: ReportStatus;
  adminRemark?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  createdAt: string;
  submittedAt: string;
  updatedAt: string;
  syncStatus?: 'SYNCED' | 'QUEUED' | 'LOCAL';
}

export interface ComplianceConfig {
  workingDays: string[];
  dailyDeadline: string; // e.g. "18:00"
  weeklyDeadlineDay: string; // e.g. "Saturday"
  weeklyDeadlineTime: string; // e.g. "20:00"
}

export interface InAppNotification {
  id: string;
  userId: string; // specific user ID or 'ADMIN'
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  reportId?: string;
  reportType?: 'DAILY' | 'WEEKLY';
  read: boolean;
  createdAt: string;
}

export interface SheetsSyncLog {
  id: string;
  timestamp: string;
  type: string;
  reportId?: string;
  status: 'SUCCESS' | 'FAILED' | 'LOCAL_QUEUED';
  message: string;
}

export interface GlobalSearchFilters {
  keyword: string;
  date?: string;
  traineeId?: string;
  traineeName?: string;
  reportType?: 'ALL' | 'DAILY' | 'WEEKLY';
  status?: ReportStatus | 'ALL';
  scope?: 'ALL' | 'MINE';
}

export interface GlobalSearchResult {
  id: string;
  type: 'DAILY' | 'WEEKLY';
  report: DailyReport | WeeklyReport;
  title: string;
  subtitle: string;
  dateStr: string;
  rawDate: string;
  userName: string;
  employeeId: string;
  department: string;
  status: ReportStatus;
  workAreaOrDept: string;
  matchedFields: { label: string; snippet: string }[];
}
