export const Roles = Object.freeze({
  ADMIN: 'Admin',
  STUDENT: 'Student'
});

export const Permissions = Object.freeze({
  DASHBOARD_READ: 'dashboard:read',
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  EXAMS_READ: 'exams:read',
  EXAMS_WRITE: 'exams:write',
  QUESTIONS_READ: 'questions:read',
  QUESTIONS_WRITE: 'questions:write',
  RESULTS_READ: 'results:read',
  RESULTS_WRITE: 'results:write',
  STUDENTS_READ: 'students:read',
  STUDENTS_WRITE: 'students:write'
});

export const defaultRolePermissions = {
  [Roles.ADMIN]: Object.values(Permissions),
  [Roles.STUDENT]: [
    Permissions.DASHBOARD_READ,
    Permissions.EXAMS_READ,
    Permissions.RESULTS_READ
  ]
};