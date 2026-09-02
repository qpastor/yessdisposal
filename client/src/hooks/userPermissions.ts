// hooks/usePermission.ts
import { useAuth } from '../context/AuthContext';
import { ROLE_PERMISSIONS, Permission, RoleId } from '../contants/permissions';

export function usePermission() {
  const { user } = useAuth(); // expects user.role_id (e.g., 1 or 2)

  const can = (permission: Permission): boolean => {
    if (!user?.role_id) return false;
    const allowed = ROLE_PERMISSIONS[user.role_id as RoleId] || [];
    return allowed.includes(permission);
  };

  return { can, roleId: user?.role_id };
}