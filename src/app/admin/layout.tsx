"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./_components/sidebar";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathName = usePathname();

  const isLoginPage = pathName?.includes("/admin/login");

  return (
    <div className="min-h-screen flex flex-row">
      {!isLoginPage && <Sidebar />}
      <main className={!isLoginPage ? "md:ml-64 ml-56 sm:ml-48 p-6 flex-1" : "flex-1"}>
        {children}
      </main>
    </div>
  );
}
