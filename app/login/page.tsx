import { LoginForm } from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";
import { getRoleHome } from "@/lib/users";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getRoleHome(user.role));
  }

  return <LoginForm />;
}
