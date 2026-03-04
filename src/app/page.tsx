'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Store, Truck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import type { UserRole } from "@/types";

const roles = [
  {
    name: "Customer",
    role: "customer" as UserRole,
    description: "Browse local vendors, add items to your cart, and place orders for delivery.",
    href: "/vendors",
    icon: ShoppingBag,
    color: "bg-green-500",
    borderColor: "border-green-500",
    hoverBg: "hover:bg-green-50",
  },
  {
    name: "Vendor",
    role: "vendor" as UserRole,
    description: "View incoming orders, update order status, and communicate with customers.",
    href: "/vendor",
    icon: Store,
    color: "bg-amber-500",
    borderColor: "border-amber-500",
    hoverBg: "hover:bg-amber-50",
  },
  {
    name: "Delivery",
    role: "delivery" as UserRole,
    description: "Accept delivery requests, navigate to pickups, and complete deliveries.",
    href: "/delivery",
    icon: Truck,
    color: "bg-blue-500",
    borderColor: "border-blue-500",
    hoverBg: "hover:bg-blue-50",
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const { setRole } = useRole();
  const router = useRouter();

  const handleRoleClick = (role: UserRole, href: string) => {
    setRole(role);
    router.push(href);
  };

  // Authenticated user: show role-based navigation
  if (user && !loading) {
    return (
      <main className="container px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="text-center space-y-2">
            <p className="text-lg text-muted-foreground">
              Welcome back, {user.name}
            </p>
            <p className="text-sm text-muted-foreground">
              Select a role to continue
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {roles.map((role) => (
              <button key={role.name} onClick={() => handleRoleClick(role.role, role.href)} className="text-left">
                <Card className={`h-full transition-colors border-2 ${role.borderColor} ${role.hoverBg} cursor-pointer`}>
                  <CardHeader className="text-center pb-2">
                    <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${role.color} text-white`}>
                      <role.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      {role.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Not authenticated: show sign-in / create account
  return (
    <main className="container px-4 py-8">
      <div className="mx-auto max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground">
            Community-powered food ordering for local co-ops
          </p>
          <p className="text-sm text-muted-foreground">
            Order from local vendors, delivered by your neighbors
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.name} className="text-center">
              <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${role.color} text-white`}>
                <role.icon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">{role.name}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Link href="/login">
            <Button className="w-full bg-green-600 hover:bg-green-700 h-12 text-base">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" className="w-full h-12 text-base">
              Create Account
            </Button>
          </Link>
          <Link href="/vendors">
            <Button variant="ghost" className="w-full text-sm text-muted-foreground">
              Browse vendors without signing in
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
