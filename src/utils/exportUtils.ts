import * as XLSX from 'xlsx';
import { DailyReport, WeeklyReport, User } from '../types';

export function exportDailyReportsToCSV(reports: DailyReport[], filename = 'Daily_Reports.csv') {
  const headers = [
    'Report ID',
    'Name of GET',
    'Employee ID',
    'Today\'s Department',
    'Department Sub Section',
    'Name of HOD',
    'Staff Met 1',
    'Staff Met 2',
    'Date',
    'Input (for Today\'s deptt.)',
    'Process (value added by this deptt.)',
    'Output (final output to next deptt.)',
    'IS & Global Standards',
    'Safety Standards',
    'Chronic Problem 1',
    'Chronic Problem 2',
    'Chronic Problem 3',
    'Back of Page Notes',
    'Status',
    'Admin Remark',
    'Reviewed By',
    'Reviewed Date',
    'Submitted At'
  ];

  const rows = reports.map(r => [
    `"${r.id}"`,
    `"${(r.nameOfGet || r.userName).replace(/"/g, '""')}"`,
    `"${r.employeeId}"`,
    `"${r.department}"`,
    `"${(r.subDepartment || '').replace(/"/g, '""')}"`,
    `"${(r.nameOfHod || r.reportingManager || '').replace(/"/g, '""')}"`,
    `"${(r.staffMet1 || '').replace(/"/g, '""')}"`,
    `"${(r.staffMet2 || '').replace(/"/g, '""')}"`,
    `"${r.date}"`,
    `"${(r.inputDept || r.workDescription || '').replace(/"/g, '""')}"`,
    `"${(r.processValueAdded || r.workDescription || '').replace(/"/g, '""')}"`,
    `"${(r.outputNextDept || r.learningOutcome || '').replace(/"/g, '""')}"`,
    `"${(r.standards || '').replace(/"/g, '""')}"`,
    `"${(r.safetyStandards || r.safetyObservations || '').replace(/"/g, '""')}"`,
    `"${(r.chronicProblem1 || r.challengesFaced || '').replace(/"/g, '""')}"`,
    `"${(r.chronicProblem2 || r.bottlenecks || '').replace(/"/g, '""')}"`,
    `"${(r.chronicProblem3 || '').replace(/"/g, '""')}"`,
    `"${(r.backOfPageNotes || r.remarks || '').replace(/"/g, '""')}"`,
    `"${r.status}"`,
    `"${(r.adminRemark || '').replace(/"/g, '""')}"`,
    `"${r.reviewedBy || ''}"`,
    `"${r.reviewedDate || ''}"`,
    `"${r.submittedAt || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportWeeklyReportsToCSV(reports: WeeklyReport[], filename = 'Weekly_Reports.csv') {
  const headers = [
    'Report ID',
    'Employee ID',
    'Name of Trainee/GET',
    'Days Present (In Week)',
    'Department',
    'Sub Department',
    'Designation',
    'Reporting Manager',
    'Week No',
    'Week Start',
    'Week End',
    'Assigned Project/Dept',
    'Classroom Training Summary',
    'Shop Floor Training Summary',
    'Projects Summary (a)',
    'Projects Summary (b)',
    'Self-Learning Summary',
    'Suggestion',
    'Trainee Signature',
    'Back of Page Notes',
    'Major Learnings',
    'Technical Skills Acquired',
    'Challenges Faced',
    'Solutions Implemented',
    'Plan For Next Week',
    'Self Assessment',
    'Status',
    'Admin Remark',
    'Reviewed By',
    'Reviewed Date',
    'Submitted At'
  ];

  const rows = reports.map(r => [
    `"${r.id}"`,
    `"${r.employeeId}"`,
    `"${r.nameOfStudentTrainee || r.userName}"`,
    `"${r.daysPresent !== undefined ? r.daysPresent : 6}"`,
    `"${r.department}"`,
    `"${r.subDepartment || ''}"`,
    `"${r.designation}"`,
    `"${r.reportingManager || ''}"`,
    `"${r.weekNumber}"`,
    `"${r.weekStart}"`,
    `"${r.weekEnd}"`,
    `"${(r.assignedProjectDept || '').replace(/"/g, '""')}"`,
    `"${(r.classroomTrainingSummary || '').replace(/"/g, '""')}"`,
    `"${(r.shopFloorTrainingSummary || '').replace(/"/g, '""')}"`,
    `"${(r.projectSummaryA || '').replace(/"/g, '""')}"`,
    `"${(r.projectSummaryB || '').replace(/"/g, '""')}"`,
    `"${(r.selfLearningSummary || '').replace(/"/g, '""')}"`,
    `"${(r.suggestion || '').replace(/"/g, '""')}"`,
    `"${(r.traineeSignature || '').replace(/"/g, '""')}"`,
    `"${(r.backOfPageNotes || '').replace(/"/g, '""')}"`,
    `"${(r.majorLearnings || '').replace(/"/g, '""')}"`,
    `"${(r.technicalSkillsAcquired || '').replace(/"/g, '""')}"`,
    `"${(r.challengesFaced || '').replace(/"/g, '""')}"`,
    `"${(r.solutionsImplemented || '').replace(/"/g, '""')}"`,
    `"${(r.planForNextWeek || '').replace(/"/g, '""')}"`,
    `"${r.traineeSelfAssessment || 'Met Expectations'}"`,
    `"${r.status}"`,
    `"${(r.adminRemark || '').replace(/"/g, '""')}"`,
    `"${r.reviewedBy || ''}"`,
    `"${r.reviewedDate || ''}"`,
    `"${r.submittedAt || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportReportsToExcel(
  dailyReports: DailyReport[],
  weeklyReports: WeeklyReport[],
  users: User[],
  filename = 'Training_Management_Reports.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Daily Reports
  const dailyData = dailyReports.map(r => ({
    'Report ID': r.id,
    'Name of GET': r.nameOfGet || r.userName,
    'Employee ID': r.employeeId,
    'Today\'s Department': r.department,
    'Department Sub Section': r.subDepartment || '',
    'Name of HOD': r.nameOfHod || r.reportingManager || '',
    'Staff Met 1': r.staffMet1 || '',
    'Staff Met 2': r.staffMet2 || '',
    'Date': r.date,
    'Input (for Today\'s deptt.)': r.inputDept || r.workDescription || '',
    'Process (value added)': r.processValueAdded || r.workDescription || '',
    'Output (to next deptt.)': r.outputNextDept || r.learningOutcome || '',
    'IS & Global Standards': r.standards || '',
    'Safety Standards': r.safetyStandards || r.safetyObservations || '',
    'Chronic Problem 1': r.chronicProblem1 || r.challengesFaced || '',
    'Chronic Problem 2': r.chronicProblem2 || r.bottlenecks || '',
    'Chronic Problem 3': r.chronicProblem3 || '',
    'Back of Page Notes': r.backOfPageNotes || r.remarks || '',
    'Status': r.status,
    'Admin Remark': r.adminRemark || '',
    'Reviewed By': r.reviewedBy || '',
    'Reviewed Date': r.reviewedDate ? new Date(r.reviewedDate).toLocaleString() : '',
    'Submitted On': r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ''
  }));
  const wsDaily = XLSX.utils.json_to_sheet(dailyData);
  XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Reports');

  // Sheet 2: Weekly Reports
  const weeklyData = weeklyReports.map(r => ({
    'Report ID': r.id,
    'Employee ID': r.employeeId,
    'Name of Student Trainee/GET': r.nameOfStudentTrainee || r.userName,
    'Days Present (in Week)': r.daysPresent !== undefined ? r.daysPresent : 6,
    'Department': r.department,
    'Sub Department': r.subDepartment || '',
    'Designation': r.designation,
    'Week No': r.weekNumber,
    'Week Start': r.weekStart,
    'Week End': r.weekEnd,
    'Classroom Training Summary': r.classroomTrainingSummary || '',
    'Shop Floor Training Summary': r.shopFloorTrainingSummary || '',
    'Projects Summary (a)': r.projectSummaryA || '',
    'Projects Summary (b)': r.projectSummaryB || '',
    'Self-Learning Summary': r.selfLearningSummary || '',
    'Suggestion': r.suggestion || '',
    'Trainee Signature': r.traineeSignature || '',
    'Back of Page Notes': r.backOfPageNotes || '',
    'Assigned Project/Dept': r.assignedProjectDept || '',
    'Major Learnings': r.majorLearnings || '',
    'Technical Skills': r.technicalSkillsAcquired || '',
    'Challenges Faced': r.challengesFaced || '',
    'Solutions Implemented': r.solutionsImplemented || '',
    'Plan For Next Week': r.planForNextWeek || '',
    'Self Assessment': r.traineeSelfAssessment || 'Met Expectations',
    'Status': r.status,
    'Admin Remark': r.adminRemark || '',
    'Reviewed By': r.reviewedBy || '',
    'Reviewed Date': r.reviewedDate ? new Date(r.reviewedDate).toLocaleString() : '',
    'Submitted On': r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ''
  }));
  const wsWeekly = XLSX.utils.json_to_sheet(weeklyData);
  XLSX.utils.book_append_sheet(wb, wsWeekly, 'Weekly Reports');

  // Sheet 3: Users
  const usersData = users.map(u => ({
    'User ID': u.id,
    'Employee ID': u.employeeId,
    'Name': u.name,
    'Email': u.email,
    'Department': u.department,
    'Designation': u.designation,
    'Role': u.role,
    'Reporting Manager': u.reportingManager,
    'Joining Date': u.joiningDate,
    'Status': u.status
  }));
  const wsUsers = XLSX.utils.json_to_sheet(usersData);
  XLSX.utils.book_append_sheet(wb, wsUsers, 'Users Directory');

  XLSX.writeFile(wb, filename);
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
