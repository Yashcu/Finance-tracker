"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <nav className="bg-indigo-600 p-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center">
          <Link href="/dashboard" className="text-xl font-bold text-white">
            Expense Tracker
          </Link>
          <div className="ml-10 flex space-x-4">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === "/dashboard"
                  ? "bg-indigo-700 text-white"
                  : "text-indigo-100 hover:bg-indigo-500"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/settings"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === "/settings"
                  ? "bg-indigo-700 text-white"
                  : "text-indigo-100 hover:bg-indigo-500"
              }`}
            >
              Settings
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {session?.user?.name && (
            <span className="text-white">Hello, {session.user.name}</span>
          )}
          {session?.user?.email && !session?.user?.name && (
            <span className="text-white">Hello, {session.user.email}</span>
          )}
          <button
            onClick={handleLogout}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
} 