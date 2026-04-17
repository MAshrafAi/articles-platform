import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
