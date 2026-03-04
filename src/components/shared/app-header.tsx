'use client';

import { useAuth } from '@/hooks/use-auth';
import { RoleSwitcher } from '@/components/shared/role-switcher';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function AppHeader() {
  const { user, loading, signOut } = useAuth();

  const showRoleSwitcher = !loading && user;

  return (
    <header className="border-b bg-background">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Project Firefly</h1>
        </div>

        {showRoleSwitcher && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.name}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
            <RoleSwitcher
              userInitials={user?.name?.charAt(0).toUpperCase() || 'U'}
            />
          </div>
        )}
      </div>
    </header>
  );
}
