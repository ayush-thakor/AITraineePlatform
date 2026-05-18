import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRoleHome } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  redirect(user ? getRoleHome(user.role) : "/login");
}
