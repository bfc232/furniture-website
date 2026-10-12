import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Admin Portal | ImportNow",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    // If not logged in (e.g. login page), render children directly
    return <>{children}</>;
  }

  return (
    <AdminShell adminEmail={session.admin.email}>
      {children}
    </AdminShell>
  );
}
