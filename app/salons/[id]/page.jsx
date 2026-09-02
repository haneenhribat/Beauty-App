"use client";
import { SalonProfilePage } from "../../../src/salon-profile.jsx";
export default function Page() {
  const id =
    typeof window === "undefined"
      ? "luna-beauty"
      : window.location.pathname.split("/")[2];
  return <SalonProfilePage id={id} />;
}
