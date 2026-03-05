'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRole } from '@/hooks/use-role';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';

const roleRoutes: Record<UserRole, string> = {
  customer: '/vendors',
  vendor: '/vendor',
  delivery: '/delivery',
};

interface RoleSwitcherProps {
  userInitials?: string;
  avatarUrl?: string;
  availableRoles?: UserRole[];
}

const roleConfig: Record<UserRole, { label: string; description: string }> = {
  customer: {
    label: 'Customer',
    description: 'Browse vendors and place orders',
  },
  vendor: {
    label: 'Vendor',
    description: 'Manage your menu and orders',
  },
  delivery: {
    label: 'Delivery',
    description: 'Pick up and deliver orders',
  },
};

export function RoleSwitcher({
  userInitials = 'U',
  avatarUrl,
  availableRoles = ['customer', 'vendor', 'delivery'],
}: RoleSwitcherProps) {
  const { currentRole, setRole, roleColor } = useRole();
  const { user, addRole } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmRole, setConfirmRole] = useState<UserRole | null>(null);
  const [adding, setAdding] = useState(false);

  const userRoles = user?.roles ?? ['customer'];

  const switchToRole = (role: UserRole) => {
    setRole(role);
    router.push(roleRoutes[role]);
    setSheetOpen(false);
    if (user?.id) {
      supabase.from('users').update({ default_role: role }).eq('id', user.id);
    }
  };

  const handleRoleClick = (role: UserRole) => {
    if (userRoles.includes(role)) {
      switchToRole(role);
    } else {
      setConfirmRole(role);
    }
  };

  const handleConfirmAddRole = async () => {
    if (!confirmRole) return;
    setAdding(true);
    await addRole(confirmRole);
    setAdding(false);
    switchToRole(confirmRole);
    setConfirmRole(null);
  };

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <button className="focus:outline-none focus:ring-2 focus:ring-ring rounded-full">
            <Avatar
              className={cn(
                'ring-2 ring-offset-2 ring-offset-background cursor-pointer',
                currentRole === 'customer' && 'ring-role-customer',
                currentRole === 'vendor' && 'ring-role-vendor',
                currentRole === 'delivery' && 'ring-role-delivery'
              )}
            >
              <AvatarImage src={avatarUrl} alt="User avatar" />
              <AvatarFallback
                className={cn(
                  currentRole === 'customer' && 'bg-role-customer text-role-customer-foreground',
                  currentRole === 'vendor' && 'bg-role-vendor text-role-vendor-foreground',
                  currentRole === 'delivery' && 'bg-role-delivery text-role-delivery-foreground'
                )}
              >
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle>What are you today?</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {availableRoles.map((role) => {
              const hasRole = userRoles.includes(role);
              return (
                <button
                  key={role}
                  onClick={() => handleRoleClick(role)}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 text-left transition-colors',
                    currentRole === role
                      ? cn(
                          'border-2',
                          role === 'customer' && 'border-role-customer bg-role-customer/10',
                          role === 'vendor' && 'border-role-vendor bg-role-vendor/10',
                          role === 'delivery' && 'border-role-delivery bg-role-delivery/10'
                        )
                      : 'border-border hover:border-muted-foreground/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{roleConfig[role].label}</div>
                    {!hasRole && (
                      <span className="text-xs text-muted-foreground border rounded px-1.5 py-0.5">
                        + Add
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {roleConfig[role].description}
                  </div>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!confirmRole} onOpenChange={(open) => !open && setConfirmRole(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add {confirmRole ? roleConfig[confirmRole].label : ''} role?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will add the <strong>{confirmRole ? roleConfig[confirmRole].label : ''}</strong> role to your account.{' '}
            {roleConfig[confirmRole ?? 'customer'].description}.
          </p>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setConfirmRole(null)} disabled={adding}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAddRole} disabled={adding}>
              {adding ? 'Adding...' : 'Add Role'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
