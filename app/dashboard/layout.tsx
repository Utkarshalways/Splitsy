import { currentUser } from "@clerk/nextjs/server";

import { TopNavbar } from "@/components/dashboard/sidebar";
import { ensureUser } from "@/lib/supabase/ensure-user";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await currentUser();
    if (user) {
        try {
            await ensureUser(user);
        } catch {
            // Sync failure should not block the dashboard shell
        }
    }

    return (
        <div className="min-h-screen bg-[#f7f9fb] text-[#2a3439] antialiased">
            <TopNavbar />
            <main className="mx-auto max-w-7xl px-6 pb-24 pt-24 md:pb-0">
                {children}
            </main>
            {/* Desktop FAB */}
            <div className="fixed bottom-8 right-8 hidden lg:block">
                <button className="flex size-14 items-center justify-center rounded-full bg-[#006c49] text-[#e1ffec] shadow-2xl transition-transform hover:bg-[#005f40] active:scale-95">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-6"
                    >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
