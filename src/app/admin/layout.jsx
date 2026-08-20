"use client";

import { AdminRoute } from "@/components/guards/RouteGuards";

export default function AdminLayout({ children }) {
  return <AdminRoute>{children}</AdminRoute>;
}
