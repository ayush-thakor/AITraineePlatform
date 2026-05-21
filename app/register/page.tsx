import RegisterForm from "@/components/RegisterForm";
import { getCurrentUser } from "@/lib/auth";
import { getRoleHome } from "@/lib/users";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getRoleHome(user.role));
  }

  return <RegisterForm />;
}
