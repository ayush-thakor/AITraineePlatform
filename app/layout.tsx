import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Trainee Platform",
  description: "Minimal SOP-driven trainee platform"
};

const navItems = [
  { href: "/admin/modules", label: "Modules" },
  { href: "/support", label: "Support" }
];

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
              <Link href="/admin/modules" className="text-lg font-semibold text-slate-900">
                AI Trainee Platform
              </Link>
              <nav className="flex gap-4 text-sm text-slate-600">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="transition hover:text-slate-900">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
