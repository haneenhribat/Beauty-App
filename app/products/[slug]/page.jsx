"use client";
import { ProductDetailsPage } from "../../../src/marketplace.jsx";
export default function Page() {
  const slug =
    typeof window === "undefined"
      ? "silk-repair-hair-mask"
      : window.location.pathname.split("/")[2];
  return <ProductDetailsPage slug={slug} />;
}
