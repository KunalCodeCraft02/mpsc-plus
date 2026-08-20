"use client";

import { ProtectedRoute } from "@/components/guards/RouteGuards";

export default function StudentLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
