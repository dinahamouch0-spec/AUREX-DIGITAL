import type { Metadata } from "next";
import { getAdminSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import "../globals.css";

export const metadata: Metadata = {
  title: "Ya 7kayti Admin",
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-ivory-deep font-sans text-brand-navy antialiased">
        <AdminShell adminEmail={session?.email}>{children}</AdminShell>
      </body>
    </html>
  );
}
