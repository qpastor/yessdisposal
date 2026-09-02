export type RoleId = 1 | 2 | 3;

export type Permission =
  | 'view:dashboard'
  | 'view:tasks'
  | 'edit:tasks'
  | 'view:requests'
  | 'edit:requests'
  | 'view:user_management'
  | 'edit:user_management';

// Map string role names from your API/DB to role IDs
const ROLE_NAME_TO_ID: Record<string, RoleId> = {
  'Admin': 1,
  'Field Manager': 2,
  'Field Technician': 2,
  'View Only': 3,
};

export const ROLE_PERMISSIONS: Record<RoleId, Permission[]> = {
  // 1: Admin - Full access
  1: [
    'view:dashboard',
    'view:tasks',
    'edit:tasks',
    'view:requests',
    'edit:requests',
    'view:user_management',
    'edit:user_management',
  ],

  // 2: Field Manager - Tasks and Requests only
  2: [
    'view:tasks',
    'edit:tasks',
    'view:requests',
    'edit:requests',
  ],

  // 3: View Only - Limited access
  3: [
    'view:tasks',
    'view:requests',
  ],
};

export const canUser = (
  roleOrId: number | string | undefined | null,
  permission: Permission
): boolean => {
  if (!roleOrId) return false;

  // Resolve role ID whether passed as number (1) or string ("Admin")
  let roleId: RoleId | undefined;

  if (typeof roleOrId === 'number') {
    roleId = roleOrId as RoleId;
  } else if (typeof roleOrId === 'string') {
    roleId = ROLE_NAME_TO_ID[roleOrId] || (Number(roleOrId) as RoleId);
  }

  if (!roleId) return false;

  const allowed = ROLE_PERMISSIONS[roleId] || [];
  return allowed.includes(permission);
};