'use client';

import { Badge } from '@/components/ui/badge';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const roleEmoji: Record<UserRole, string> = {
  customer: '',
  vendor: '',
  delivery: '',
};

const roleLabels: Record<UserRole, string> = {
  customer: 'Customer',
  vendor: 'Vendor',
  delivery: 'Delivery',
};

export function RoleBadge({ role, size = 'md', className }: RoleBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  return (
    <Badge
      className={cn(
        sizeClasses[size],
        role === 'customer' && 'bg-role-customer text-role-customer-foreground',
        role === 'vendor' && 'bg-role-vendor text-role-vendor-foreground',
        role === 'delivery' && 'bg-role-delivery text-role-delivery-foreground',
        className
      )}
    >
      {roleEmoji[role]} {roleLabels[role]}
    </Badge>
  );
}
