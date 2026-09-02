"use client";
import { MyOrdersPage } from "../../src/marketplace.jsx";
import { ProtectedRoute } from "../../src/components/ProtectedRoute.jsx";
export default function Page() {
  return (
    <ProtectedRoute>
      <MyOrdersPage />
    </ProtectedRoute>
  );
}
