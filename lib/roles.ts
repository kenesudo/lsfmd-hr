export const HR_ROLES = [
  'Commander',
  'Assistant Commander',
  'Supervisor',
  'General',
  'Probationary',
] as const;

export type HrRole = (typeof HR_ROLES)[number];

export const ADMIN_ROLES: HrRole[] = ['Commander', 'Assistant Commander'];

export const isAdminRole = (role: string | null | undefined): role is HrRole => {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
};
