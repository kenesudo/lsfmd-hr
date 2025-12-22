export const PROCESS_OPTIONS = [
  { value: 'employee_profile_creation', label: 'Employee Profile - Creation' },
  { value: 'employee_profile_update', label: 'Employee Profile - Update' },

  { value: 'application_pending_interview', label: 'Application - Pending Interview' },
  { value: 'application_pending_badge', label: 'Application - Pending Badge' },
  { value: 'application_hired', label: 'Application - Hired' },
  { value: 'application_on_hold', label: 'Application - On Hold' },
  { value: 'application_closed', label: 'Application - Closed' },
  { value: 'application_denied', label: 'Application - Denied' },
  { value: 'application_blacklisted', label: 'Application - Blacklisted' },

  { value: 'reinstatement_on_hold', label: 'Reinstatement - On Hold' },
  { value: 'reinstatement_pending_recommendations', label: 'Reinstatement - Pending Recommendations' },
  { value: 'reinstatement_pending_exam', label: 'Reinstatement - Pending Exam' },
  { value: 'reinstatement_pending_badge', label: 'Reinstatement - Pending Badge' },
  { value: 'reinstatement_exam_failed', label: 'Reinstatement - Exam Failed' },
  { value: 'reinstatement_denied', label: 'Reinstatement - Denied' },

  { value: 'training_orientation', label: 'Training - Orientation' },
  { value: 'training_practical', label: 'Training - Practical' },
  { value: 'training_exam', label: 'Training - Exam' },
  { value: 'training_tf_creation', label: 'Training File - Creation' },
  { value: 'training_tf_closure', label: 'Training File - Closure' },

  { value: 'lr_interview', label: 'LR Interview' },

  { value: 'supervision', label: 'Supervision' },
  { value: 'supervision_interview', label: 'Supervision - Interview' },
  { value: 'supervision_orentation', label: 'Supervision - Orentation' },
  { value: 'supervision_practical', label: 'Supervision - Practical' },
  { value: 'supervision_reinstatement_exam', label: 'Supervision - Reinstatement Exam' },
  { value: 'supervision_exam', label: 'Supervision - Exam' },
] as const;

export type ProcessType = (typeof PROCESS_OPTIONS)[number]['value'];

export const PROCESS_LABELS = new Map<ProcessType, string>(
  PROCESS_OPTIONS.map((o) => [o.value, o.label] as const),
);

export const asProcessType = (value: string): ProcessType | null => {
  return PROCESS_LABELS.has(value as ProcessType) ? (value as ProcessType) : null;
};
