import { LoginForm } from "@/components/admin/LoginForm";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";

export const metadata = { title: "Admin · FrankyShop" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const sp = (await searchParams) as { next?: string };
  const session = await getCurrentStaff();
  if (session) redirect(sp.next && sp.next.startsWith("/admin") ? sp.next : "/admin");
  return (
    <main className="grid min-h-screen items-center bg-surface-muted px-6 py-16">
      <LoginForm next={sp.next ?? "/admin"} />
    </main>
  );
}
