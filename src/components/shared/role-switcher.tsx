'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useRole } from '@/hooks/use-role';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';

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

  return (
    <Sheet>
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
          {availableRoles.map((role) => (
            <button
              key={role}
              onClick={() => setRole(role)}
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
              <div className="font-medium">{roleConfig[role].label}</div>
              <div className="text-sm text-muted-foreground">
                {roleConfig[role].description}
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
