import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/auth";
import { getRoleHome, ROLE_LABELS, type AuthUser } from "@/lib/users";

export const metadata: Metadata = {
  title: "AI Trainee Platform",
  description: "Minimal SOP-driven trainee platform"
};

function getNavItems(user: AuthUser | null) {
  if (!user) {
    return [
      { href: "/login", label: "Login" },
      { href: "/register", label: "Register" }
    ];
  }

  if (user.role === "manager") {
    return [
      { href: "/manager/progress", label: "Progress" },
      { href: "/admin/modules", label: "Modules" },
      { href: "/admin/modules/new", label: "Upload" },
      { href: "/support", label: "Support" }
    ];
  }

  if (user.role === "content-uploader") {
    return [
      { href: "/admin/modules", label: "Modules" },
      { href: "/admin/modules/new", label: "Upload" }
    ];
  }

  return [
    { href: "/trainee", label: "Training" },
    { href: "/support", label: "Support" }
  ];
}

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const navItems = getNavItems(user);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
              <Link
                href={user ? getRoleHome(user.role) : "/login"}
                className="text-lg font-semibold text-slate-900"
              >
                AI Trainee Platform
              </Link>
              <div className="flex flex-wrap items-center gap-4">
                <nav className="flex flex-wrap gap-4 text-sm text-slate-600">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} className="transition hover:text-slate-900">
                      {item.label}
                    </Link>
                  ))}
                </nav>
                {user ? (
                  <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {ROLE_LABELS[user.role]}
                    </span>
                    <LogoutButton />
                  </div>
                ) : null}
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
