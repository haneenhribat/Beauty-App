"use client";
import { CartPage } from "../../src/marketplace.jsx";
import { ProtectedRoute } from "../../src/components/ProtectedRoute.jsx";
export default function Page() {
  return (
    <ProtectedRoute>
      <CartPage />
    </ProtectedRoute>
  );
}
