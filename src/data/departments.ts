export const HR_DEPARTMENTS = [
  'Human Resources (Core HR)',
  'Learning and Development',
  'HR - Talent Acquisition & Recruitment',
  'HR - Training & Development (L&D)',
  'HR - Employee Relations & Welfare',
  'HR - Compensation, Benefits & Payroll',
  'HR - Operations & General Administration',
  'HR - Industrial Relations (IR) & Statutory Compliance',
  'HR - Performance Management & Appraisal',
] as const;

export type HRDepartmentName = typeof HR_DEPARTMENTS[number];

export const POST_LEVELS = [
  'HR Trainee / Intern',
  'Management Trainee (MT - HR)',
  'Graduate Engineer Trainee (GET)',
  'Diploma Engineer Trainee (DET)',
  'Junior HR Executive',
  'HR Executive',
  'Senior HR Executive',
  'Assistant Manager (AM - HR)',
  'Deputy Manager (DM - HR)',
  'Manager (HR Manager)',
  'Senior Manager (HR)',
  'Assistant General Manager (AGM)',
  'Deputy General Manager (DGM)',
  'General Manager (GM) / Head of HR',
  'Vice President (VP - HR)',
] as const;

export type PostLevelName = typeof POST_LEVELS[number];

export const DEPARTMENTS = [
  'Human Resources (Core HR)',
  'Learning and Development',
  'HR - Talent Acquisition & Recruitment',
  'HR - Training & Development (L&D)',
  'HR - Employee Relations & Welfare',
  'HR - Compensation, Benefits & Payroll',
  'HR - Operations & General Administration',
  'HR - Industrial Relations (IR) & Statutory Compliance',
  'HR - Performance Management & Appraisal',
  'Production',
  'Quality',
  'Production Planning Control',
  'After Sales',
  'Sales and Marketing',
  'Design and Development',
] as const;

export type DepartmentName = typeof DEPARTMENTS[number];

export const PRODUCTION_SUB_DEPARTMENTS = [
  'Core Assembly & Lamination',
  'Coil Winding (HV & LV)',
  'Core-Coil Assembly (CCA)',
  'Tanking, Fabrication & Welding',
  'Drying & Vacuum Impregnation (Oven)',
  'Testing & Routine Inspection',
  'Painting & Surface Coating',
  'Final Assembly & Dispatch',
] as const;

export type ProductionSubDepartment = typeof PRODUCTION_SUB_DEPARTMENTS[number];

export const DEPARTMENT_SUB_DEPARTMENTS: Record<string, readonly string[]> = {
  'Human Resources (Core HR)': [
    'Talent Acquisition & Sourcing',
    'HR Policy & Induction',
    'Employee Engagement & Welfare',
    'HR Operations & Documentation',
    'Performance Appraisal Support',
  ],
  'Learning and Development': [
    'GET / DET Training Curriculum & Onboarding',
    'Shop Floor Technical Training Schedules',
    'Skill Matrix & Competency Mapping',
    'Training Needs Identification (TNI)',
    'Training Feedback & Trainee Assessment',
    'Leadership, Soft Skills & Behavioral Workshops',
  ],
  'HR - Talent Acquisition & Recruitment': [
    'Campus Hiring & Trainee Onboarding',
    'Lateral Technical Recruitment',
    'Job Portals & Interview Scheduling',
    'Candidate Assessment & Verification',
    'Offer Letters & Joining Formalities',
  ],
  'HR - Training & Development (L&D)': [
    'GET / DET Training Curriculum',
    'Shop Floor Technical Training Schedules',
    'Skill Matrix & Competency Mapping',
    'Training Feedback & Assessments',
    'Leadership & Soft Skills Workshops',
  ],
  'HR - Employee Relations & Welfare': [
    'Grievance Redressal & Counseling',
    'Workplace Safety & Employee Well-being',
    'Canteen, Transport & Facilities Administration',
    'Employee Engagement Activities & Celebrations',
    'Internal Committee (POSH) & HR Helpdesk',
  ],
  'HR - Compensation, Benefits & Payroll': [
    'Monthly Attendance & Biometric Audits',
    'Salary Structure & CTC Formulation',
    'Incentives, Overtime & Bonus Processing',
    'Leaves, Gratuity & Full & Final Settlement',
    'Statutory Deductions (PF, ESIC, PT, TDS)',
  ],
  'HR - Operations & General Administration': [
    'Personnel Records & Employee Master Database',
    'ID Cards, Uniforms & PPE Allocation',
    'HR Portal Administration & Software Management',
    'Vendor Management & HR Logistics',
    'Office Administration & Front Desk Support',
  ],
  'HR - Industrial Relations (IR) & Statutory Compliance': [
    'Factories Act & Labour Law Filings',
    'Contract Labour Management & Audit',
    'Disciplinary Proceedings & Inquiry Documentation',
    'Government Liaisoning & Inspections',
    'Safety Committee & Standing Orders',
  ],
  'HR - Performance Management & Appraisal': [
    'KPI / KRA Goal Setting & Alignment',
    'Quarterly & Annual Performance Reviews',
    'Trainee Probation Confirmation Assessments',
    'High-Performer Recognition & Succession',
    'Performance Improvement Plans (PIP)',
  ],
  Production: PRODUCTION_SUB_DEPARTMENTS,
  Quality: [
    'Incoming Raw Material QC',
    'In-Process Quality Inspection',
    'Final Testing & Calibration',
    'Quality Assurance & Audit (ISO / NABL)',
    'Customer Inspection & FAT Coordination',
  ],
  'Production Planning Control': [
    'Material Requirement Planning (MRP)',
    'Shop Floor Scheduling & Dispatch',
    'Inventory & Raw Material Control',
    'Subcontracting & Job Work Tracking',
    'Daily Production Monitoring & MIS',
  ],
  'After Sales': [
    'Site Installation & Commissioning',
    'Warranty Service & Troubleshooting',
    'Annual Maintenance Contracts (AMC)',
    'Spare Parts Supply & Overhaul',
    'Customer Support & Field Service',
  ],
  'Sales and Marketing': [
    'Tendering & Government Bids (State Discoms / PGCIL)',
    'Private Client Sales & Industrial Marketing',
    'Estimation & Costing',
    'Contract Execution & Order Booking',
    'Client Relationship & Brand Management',
  ],
  'Design and Development': [
    'Electrical Core & Coil Design',
    'Mechanical & Structural Tank Design',
    'Research & Development (R&D)',
    'Drafting, BOM & 3D Modeling',
    'Cost Optimization & Value Engineering',
  ],
};

export const OLD_DEMO_DEPARTMENT_MAP: Record<string, { department: string; subDepartment?: string }> = {
  'Electrical & Instrumentation': {
    department: 'Production',
    subDepartment: 'Coil Winding (HV & LV)',
  },
  'Mechanical & Maintenance': {
    department: 'Production',
    subDepartment: 'Tanking, Fabrication & Welding',
  },
  'Automation & SCADA Systems': {
    department: 'Production Planning Control',
    subDepartment: 'Shop Floor Scheduling & Dispatch',
  },
  'Production & Quality Assurance': {
    department: 'Quality',
    subDepartment: 'Quality Assurance & Audit (ISO / NABL)',
  },
  'Corporate HR & Technical Training': {
    department: 'Production Planning Control',
    subDepartment: 'Daily Production Monitoring & MIS',
  },
};

export function normalizeDepartment(
  dept: string | undefined | null,
  existingSubDept?: string
): { department: string; subDepartment?: string } {
  if (!dept) {
    return { department: 'Production', subDepartment: 'Core Assembly & Lamination' };
  }

  // Check if it's an old demo department
  if (OLD_DEMO_DEPARTMENT_MAP[dept]) {
    const mapped = OLD_DEMO_DEPARTMENT_MAP[dept];
    return {
      department: mapped.department,
      subDepartment: existingSubDept || mapped.subDepartment,
    };
  }

  // Check if dept is already one of the actual departments
  const match = DEPARTMENTS.find(d => d.toLowerCase() === dept.trim().toLowerCase());
  if (match) {
    return { department: match, subDepartment: existingSubDept };
  }

  // Fallback if not recognized
  return { department: dept, subDepartment: existingSubDept };
}

export function getDepartmentColor(dept: string): {
  bg: string;
  text: string;
  border: string;
  badgeClass: string;
} {
  if (
    dept.includes('HR') ||
    dept.toLowerCase().includes('human resources') ||
    dept.toLowerCase().includes('learning') ||
    dept.toLowerCase().includes('development') && dept.toLowerCase().includes('learning')
  ) {
    return {
      bg: 'bg-violet-50 dark:bg-violet-950/60',
      text: 'text-violet-700 dark:text-violet-300',
      border: 'border-violet-200 dark:border-violet-800',
      badgeClass: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    };
  }

  switch (dept) {
    case 'Production':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/60',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      };
    case 'Quality':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      };
    case 'Production Planning Control':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/60',
        text: 'text-amber-800 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      };
    case 'After Sales':
      return {
        bg: 'bg-teal-50 dark:bg-teal-950/60',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-800',
        badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      };
    case 'Sales and Marketing':
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/60',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800',
        badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      };
    case 'Design and Development':
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/60',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
        badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      };
    default:
      return {
        bg: 'bg-slate-50 dark:bg-slate-900',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-800',
        badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      };
  }
}
