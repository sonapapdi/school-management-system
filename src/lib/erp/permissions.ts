import type { ModuleKey, PermAction, Role } from './types';

/**
 * Backend-style permission matrix. Hiding UI is not enough —
 * screens render explicit permission-denied states using can().
 */
const MATRIX: Record<Role, Partial<Record<ModuleKey, PermAction[]>>> = {
  platform_operator: {
    settings: ['view', 'update'],
    reports: ['view'],
  },
  school_admin: {
    dashboard: ['view'],
    students: ['view', 'create', 'update', 'approve', 'export'],
    attendance: ['view', 'update', 'approve', 'export'],
    fees: ['view', 'create', 'update', 'approve', 'export'],
    staff: ['view', 'create', 'update', 'export'],
    academics: ['view', 'create', 'update', 'export'],
    notices: ['view', 'create', 'update', 'approve', 'export'],
    reports: ['view', 'export'],
    approvals: ['view', 'approve', 'export'],
    settings: ['view', 'create', 'update', 'export'],
  },
  principal: {
    dashboard: ['view'],
    students: ['view', 'export'],
    attendance: ['view', 'approve', 'export'],
    fees: ['view', 'approve', 'export'],
    staff: ['view'],
    academics: ['view'],
    notices: ['view', 'create', 'approve'],
    reports: ['view', 'export'],
    approvals: ['view', 'approve'],
    settings: ['view'],
  },
  receptionist: {
    dashboard: ['view'],
    students: ['view', 'create', 'update', 'export'],
    attendance: ['view'],
    fees: ['view'],
    staff: ['view'],
    academics: ['view'],
    notices: ['view', 'create'],
    reports: ['view'],
    approvals: ['view'],
  },
  accountant: {
    dashboard: ['view'],
    students: ['view'],
    attendance: ['view'],
    fees: ['view', 'create', 'update', 'export'],
    staff: ['view'],
    academics: ['view'],
    notices: ['view'],
    reports: ['view', 'export'],
    approvals: ['view'],
  },
  teacher: {
    dashboard: ['view'],
    students: ['view'],
    attendance: ['view', 'create', 'update'],
    notices: ['view'],
    academics: ['view'],
    reports: ['view'],
  },
  parent: {
    attendance: ['view'],
    fees: ['view'],
    notices: ['view'],
    students: ['view'],
  },
};

export function can(role: Role, module: ModuleKey, action: PermAction = 'view'): boolean {
  return MATRIX[role]?.[module]?.includes(action) ?? false;
}

export function roleModules(role: Role): ModuleKey[] {
  return Object.keys(MATRIX[role] ?? {}) as ModuleKey[];
}
