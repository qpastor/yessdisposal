// components/Can.tsx

import React from 'react';
import { Permission } from '../contants/permissions';
import { usePermission } from '../hooks/userPermissions';

interface CanProps {
  perform: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ perform, children, fallback = null }) => {
  const { can } = usePermission();

  if (!can(perform)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};