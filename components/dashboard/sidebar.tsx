"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
    LayoutDashboard,
    Receipt,
    Users,
    Settings,
    Menu,
    X,
    History,
    Home,
    Split,
    User,
} from "lucide-react";
import { useState } from "react";

const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/expenses", label: "Activity" },
    { href: "/dashboard/friends", label: "Friends" },
    { href: "/dashboard/settings", label: "Settings" },
];

const mobileNavItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/dashboard/expenses", label: "Activity", icon: History },
    { href: "/dashboard/friends", label: "Friends", icon: Users },
    { href: "/dashboard/settings", label: "Profile", icon: User },
];

export function TopNavbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Top Header */}
            <header className="fixed top-0 z-50 w-full border-b border-[#a9b4b910] bg-white/80 shadow-sm backdrop-blur-xl">
                <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="text-[#006c49] md:hidden"
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </button>
                        <Link
                            href="/"
                            className="text-xl font-bold tracking-tighter text-[#006c49]"
                        >
                            Splitsy
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden items-center gap-8 md:flex">
                        {navItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/dashboard" && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`text-sm font-semibold transition-colors ${isActive
                                            ? "text-[#006c49]"
                                            : "text-[#566166] hover:text-[#006c49]"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User */}
                    <div className="flex items-center gap-3">
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox:
                                        "size-10 rounded-full border-2 border-white shadow-sm",
                                },
                            }}
                        />
                    </div>
                </div>

                {/* Mobile dropdown */}
                {mobileOpen && (
                    <div className="border-t border-[#a9b4b920] bg-white px-6 pb-4 pt-2 md:hidden">
                        {navItems.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/dashboard" && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${isActive
                                            ? "bg-[#006c49]/10 text-[#006c49]"
                                            : "text-[#566166] hover:bg-[#f0f4f7]"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </header>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-[#a9b4b920] bg-white/80 px-4 pb-6 pt-3 backdrop-blur-xl md:hidden">
                {mobileNavItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center ${isActive ? "scale-110 text-[#006c49]" : "text-[#a9b4b9]"
                                }`}
                        >
                            <item.icon
                                className="size-5"
                                fill={isActive ? "currentColor" : "none"}
                            />
                            <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
