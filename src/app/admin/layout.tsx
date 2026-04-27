import type { Metadata } from "next";
import { getCurrentStaff } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin · FrankyShop",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const session = await getCurrentStaff();
  // Login page is unauthenticated; render bare. proxy.ts gates other /admin paths.
  if (!session) return <>{children}</>;
  return <AdminShell session={session}>{children}</AdminShell>;
}
