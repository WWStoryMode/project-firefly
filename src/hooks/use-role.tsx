'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { UserRole } from '@/types';

interface RoleContextType {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  roleColor: string;
  roleName: string;
}

const roleConfig: Record<UserRole, { color: string; name: string }> = {
  customer: { color: 'role-customer', name: 'Customer' },
  vendor: { color: 'role-vendor', name: 'Vendor' },
  delivery: { color: 'role-delivery', name: 'Delivery' },
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({
  children,
  defaultRole = 'customer'
}: {
  children: ReactNode;
  defaultRole?: UserRole;
}) {
  const [currentRole, setCurrentRole] = useState<UserRole>(defaultRole);

  const setRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
  }, []);

  const value: RoleContextType = {
    currentRole,
    setRole,
    roleColor: roleConfig[currentRole].color,
    roleName: roleConfig[currentRole].name,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
