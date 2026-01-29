'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';

interface CartFloatingButtonProps {
  vendorId: string;
}

export function CartFloatingButton({ vendorId }: CartFloatingButtonProps) {
  const { totalItems, totalAmount, vendorId: cartVendorId } = useCart();

  // Only show if cart has items from this vendor
  if (totalItems === 0 || cartVendorId !== vendorId) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-2xl mx-auto">
        <Link href="/cart">
          <Button className="w-full bg-green-600 hover:bg-green-700 h-12 text-base">
            <ShoppingCart className="w-5 h-5 mr-2" />
            View Cart ({totalItems} items) - ${totalAmount.toFixed(2)}
          </Button>
        </Link>
      </div>
    </div>
  );
}
