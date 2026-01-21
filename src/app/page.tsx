'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleSwitcher } from "@/components/shared/role-switcher";
import { RoleBadge } from "@/components/shared/role-badge";
import { useRole } from "@/hooks/use-role";
import { cn } from "@/lib/utils";

export default function Home() {
  const { currentRole, roleName } = useRole();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">Firefly</span>
            <RoleBadge role={currentRole} size="sm" />
          </div>
          <RoleSwitcher userInitials="WD" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Firefly</CardTitle>
              <CardDescription>
                Community-powered food ordering for local co-ops
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You are currently viewing as a <strong>{roleName}</strong>.
                Tap your profile picture in the top right to switch roles.
              </p>

              {/* Role-specific content preview */}
              <div
                className={cn(
                  "rounded-lg border-2 p-4",
                  currentRole === 'customer' && "border-role-customer bg-role-customer/5",
                  currentRole === 'vendor' && "border-role-vendor bg-role-vendor/5",
                  currentRole === 'delivery' && "border-role-delivery bg-role-delivery/5"
                )}
              >
                {currentRole === 'customer' && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Customer View</h3>
                    <p className="text-sm text-muted-foreground">
                      Browse local vendors, place orders, and track your deliveries.
                    </p>
                  </div>
                )}
                {currentRole === 'vendor' && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Vendor View</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your menu, view incoming orders, and chat with customers.
                    </p>
                  </div>
                )}
                {currentRole === 'delivery' && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Delivery View</h3>
                    <p className="text-sm text-muted-foreground">
                      Set your availability, accept deliveries, and navigate to destinations.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {currentRole === 'customer' && (
                  <>
                    <Button className="w-full bg-role-customer hover:bg-role-customer/90">
                      Browse Vendors
                    </Button>
                    <Button variant="outline" className="w-full">
                      My Orders
                    </Button>
                  </>
                )}
                {currentRole === 'vendor' && (
                  <>
                    <Button className="w-full bg-role-vendor hover:bg-role-vendor/90">
                      View Orders
                    </Button>
                    <Button variant="outline" className="w-full">
                      Edit Menu
                    </Button>
                  </>
                )}
                {currentRole === 'delivery' && (
                  <>
                    <Button className="w-full bg-role-delivery hover:bg-role-delivery/90">
                      Set Availability
                    </Button>
                    <Button variant="outline" className="w-full">
                      Active Deliveries
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Role Badges Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Role System</CardTitle>
              <CardDescription>
                Each role has its own color identity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <RoleBadge role="customer" />
                <RoleBadge role="vendor" />
                <RoleBadge role="delivery" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
