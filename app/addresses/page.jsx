"use client";
import { AddressesPage } from "../../src/marketplace.jsx";
import { ProtectedRoute } from "../../src/components/ProtectedRoute.jsx";
export default function Page() {
  return (
    <ProtectedRoute>
      <AddressesPage />
    </ProtectedRoute>
  );
}
