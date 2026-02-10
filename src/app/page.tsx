import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Store, Truck } from "lucide-react";
import { DEMO_MODE } from "@/lib/config/demo";

const roles = [
  {
    name: "Customer",
    description: "Browse local vendors, add items to your cart, and place orders for delivery.",
    href: "/vendors",
    icon: ShoppingBag,
    color: "bg-green-500",
    borderColor: "border-green-500",
    hoverBg: "hover:bg-green-50",
  },
  {
    name: "Vendor",
    description: "View incoming orders, update order status, and communicate with customers.",
    href: "/vendor",
    icon: Store,
    color: "bg-amber-500",
    borderColor: "border-amber-500",
    hoverBg: "hover:bg-amber-50",
  },
  {
    name: "Delivery",
    description: "Accept delivery requests, navigate to pickups, and complete deliveries.",
    href: "/delivery",
    icon: Truck,
    color: "bg-blue-500",
    borderColor: "border-blue-500",
    hoverBg: "hover:bg-blue-50",
  },
];

export default function Home() {
  if (!DEMO_MODE) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background">
          <div className="container flex h-16 items-center justify-center px-4">
            <h1 className="text-2xl font-bold">Project Firefly</h1>
          </div>
        </header>

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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-center px-4">
          <h1 className="text-2xl font-bold">Project Firefly Demo</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Description */}
          <div className="text-center space-y-2">
            <p className="text-lg text-muted-foreground">
              Community-powered food ordering for local co-ops
            </p>
            <p className="text-sm text-muted-foreground">
              Select a role below to explore the demo
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {roles.map((role) => (
              <Link key={role.name} href={role.href}>
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
              </Link>
            ))}
          </div>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Test the Full Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Open <strong>3 browser tabs</strong> (or use incognito windows)</li>
                <li>In Tab 1: Click <strong>Customer</strong> → Browse vendors and place an order</li>
                <li>In Tab 2: Click <strong>Vendor</strong> → Watch for incoming orders and accept them</li>
                <li>In Tab 3: Click <strong>Delivery</strong> → Accept the delivery and mark it complete</li>
              </ol>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                All roles see real-time updates via Supabase. Changes in one tab appear instantly in others.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
