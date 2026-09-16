import {
    ArrowDownLeft,
    ArrowUpRight,
    Plus,
    Receipt,
    TrendingUp,
    Users,
    Utensils,
    Plane,
    ShoppingCart,
    Home,
    Zap,
    HelpCircle,
    Sparkles,
    QrCode,
    Wallet,
    HandCoins,
} from "lucide-react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const categoryIcons: Record<string, React.ElementType> = {
    food: Utensils,
    travel: Plane,
    shopping: ShoppingCart,
    housing: Home,
    utilities: Zap,
    general: Receipt,
};

function getCategoryIcon(category: string) {
    return categoryIcons[category] ?? HelpCircle;
}

export default async function DashboardPage() {
    const user = await currentUser();
    const clerkId = user?.id;

    let totalOwed = 0;
    let totalOwing = 0;
    let recentTransactions: Array<{
        id: string;
        description: string;
        amount: number;
        category: string;
        created_at: string;
        creator_id: string;
        splitCount: number;
    }> = [];

    if (clerkId) {
        try {
            const supabase = getSupabaseAdmin();

            const { data: owingSplits } = await supabase
                .from("splits")
                .select("amount_owed, is_paid, transaction_id")
                .eq("user_id", clerkId)
                .eq("is_paid", false);

            const { data: myTransactions } = await supabase
                .from("transactions")
                .select("id")
                .eq("creator_id", clerkId);

            const myTransactionIds = myTransactions?.map((t: { id: string }) => t.id) ?? [];

            if (myTransactionIds.length > 0) {
                const { data: owedSplits } = await supabase
                    .from("splits")
                    .select("amount_owed, is_paid, user_id")
                    .in("transaction_id", myTransactionIds)
                    .neq("user_id", clerkId)
                    .eq("is_paid", false);

                totalOwed =
                    owedSplits?.reduce(
                        (sum: number, s: { amount_owed: number }) =>
                            sum + Number(s.amount_owed),
                        0,
                    ) ?? 0;
            }

            totalOwing =
                owingSplits
                    ?.filter(
                        (s: { transaction_id: string }) =>
                            !myTransactionIds.includes(s.transaction_id),
                    )
                    .reduce(
                        (sum: number, s: { amount_owed: number }) =>
                            sum + Number(s.amount_owed),
                        0,
                    ) ?? 0;

            const { data: recent } = await supabase
                .from("transactions")
                .select("id, description, amount, category, created_at, creator_id")
                .or(
                    `creator_id.eq.${clerkId},id.in.(${(owingSplits?.map((s: { transaction_id: string }) => s.transaction_id) ?? [])
                        .map((id: string) => `"${id}"`)
                        .join(",") || '""'
                    })`,
                )
                .order("created_at", { ascending: false })
                .limit(5);

            if (recent) {
                for (const tx of recent) {
                    const { count } = await supabase
                        .from("splits")
                        .select("id", { count: "exact", head: true })
                        .eq("transaction_id", tx.id);

                    recentTransactions.push({
                        ...tx,
                        amount: Number(tx.amount),
                        splitCount: count ?? 0,
                    });
                }
            }
        } catch {
            // Database not set up yet — show empty state
        }
    }

    const netBalance = totalOwed - totalOwing;
    const totalBalance = totalOwed + totalOwing;
    const firstName = user?.firstName ?? "there";

    return (
        <div>
            {/* Hero Balance Section */}
            <section className="mb-12">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div>
                        <p className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-[#566166]">
                            Current Standing
                        </p>
                        <h2 className="text-[3.5rem] font-bold leading-none tracking-[-0.04em] text-[#2a3439]">
                            ${Math.abs(netBalance).toFixed(2)}
                        </h2>
                    </div>
                    <Link
                        href="/dashboard/expenses"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#006c49] to-[#005f40] px-8 py-4 font-semibold text-[#e1ffec] shadow-lg shadow-[#006c49]/20 transition-all active:scale-95 md:w-auto"
                    >
                        <Plus className="size-5" />
                        Log Transaction
                    </Link>
                </div>
            </section>

            {/* Stats Grid */}
            <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Total Balance */}
                <div className="group relative flex h-32 flex-col justify-between overflow-hidden rounded-xl bg-white p-6 shadow-[0_20px_40px_rgba(42,52,57,0.04)]">
                    <div className="absolute right-0 top-0 p-4 opacity-10 transition-transform group-hover:scale-110">
                        <Wallet className="size-16" />
                    </div>
                    <span className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[#566166]">
                        Total Balance
                    </span>
                    <span className="text-2xl font-bold text-[#2a3439]">
                        ${totalBalance.toFixed(2)}
                    </span>
                </div>

                {/* Owed to You */}
                <div className="group flex h-32 flex-col justify-between rounded-xl border-l-4 border-[#006c49] bg-white p-6 shadow-[0_20px_40px_rgba(42,52,57,0.04)]">
                    <span className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[#006c49]">
                        Owed to You
                    </span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[#006c49]">
                            +${totalOwed.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* You Owe */}
                <div className="group flex h-32 flex-col justify-between rounded-xl border-l-4 border-[#9f403d] bg-white p-6 shadow-[0_20px_40px_rgba(42,52,57,0.04)]">
                    <span className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[#9f403d]">
                        You Owe
                    </span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[#9f403d]">
                            -${totalOwing.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Activity + Bento Grid */}
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                {/* Recent Activity (2/3) */}
                <div className="lg:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-xl font-semibold tracking-tight text-[#2a3439]">
                            Recent Activity
                        </h3>
                        <Link
                            href="/dashboard/expenses"
                            className="text-sm font-semibold text-[#006c49] hover:underline"
                        >
                            View All
                        </Link>
                    </div>

                    {recentTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 text-center shadow-[0_20px_40px_rgba(42,52,57,0.04)]">
                            <div className="mb-4 rounded-2xl bg-[#f0f4f7] p-4">
                                <Receipt className="size-8 text-[#a9b4b9]" />
                            </div>
                            <p className="text-sm font-medium text-[#566166]">
                                No transactions yet
                            </p>
                            <p className="mt-1 text-xs text-[#a9b4b9]">
                                Add your first expense to get started
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentTransactions.map((tx) => {
                                const Icon = getCategoryIcon(tx.category);
                                const isCreator = tx.creator_id === clerkId;

                                return (
                                    <div
                                        key={tx.id}
                                        className="group flex cursor-pointer items-center justify-between rounded-xl bg-white p-5 transition-colors hover:bg-[#f0f4f7]"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex size-12 items-center justify-center rounded-full bg-[#e1e9ee] text-[#006c49] transition-transform group-hover:scale-110">
                                                <Icon className="size-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-[#2a3439]">
                                                    {tx.description || "Untitled expense"}
                                                </h4>
                                                <p className="text-xs text-[#566166]">
                                                    {new Date(tx.created_at).toLocaleDateString()} •
                                                    Shared with {tx.splitCount}{" "}
                                                    {tx.splitCount === 1 ? "person" : "people"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-[#2a3439]">
                                                ${tx.amount.toFixed(2)}
                                            </p>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tx.splitCount > 0
                                                        ? "bg-[#6ffbbe66] text-[#005e3f]"
                                                        : "bg-[#e1e9ee] text-[#566166]"
                                                    }`}
                                            >
                                                {tx.splitCount > 0 ? "Split" : "Private"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Side Bento Column (1/3) */}
                <div className="space-y-6">
                    {/* Group Card */}
                    <div className="relative overflow-hidden rounded-xl bg-emerald-900 p-6 text-white shadow-xl shadow-emerald-900/20">
                        <div className="relative z-10">
                            <h4 className="mb-1 text-lg font-bold">Your Friends</h4>
                            <p className="mb-4 text-xs text-emerald-100/70">
                                Manage your Splitsy connections
                            </p>
                            <Link
                                href="/dashboard/friends"
                                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/20"
                            >
                                <Users className="size-4" />
                                View Friends
                            </Link>
                        </div>
                        <div className="absolute -mr-16 -mt-16 right-0 top-0 size-32 rounded-full bg-emerald-800/40 blur-3xl" />
                    </div>

                    {/* Insights Card */}
                    <div className="rounded-xl border border-[#a9b4b910] bg-white p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <Sparkles className="size-4 text-[#006c49]" />
                            <h4 className="text-sm font-semibold">Spending Insight</h4>
                        </div>
                        <p className="text-sm leading-relaxed text-[#566166]">
                            {totalOwed > 0 ? (
                                <>
                                    You are owed{" "}
                                    <span className="font-bold text-[#2a3439]">
                                        ${totalOwed.toFixed(2)}
                                    </span>{" "}
                                    across all your transactions. Keep track and settle up!
                                </>
                            ) : (
                                <>
                                    Start adding expenses and friends to see your spending
                                    insights here.
                                </>
                            )}
                        </p>
                        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[#e1e9ee]">
                            <div
                                className="h-full rounded-full bg-[#006c49]"
                                style={{
                                    width: `${totalBalance > 0 ? Math.min((totalOwed / totalBalance) * 100, 100) : 0}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            href="/dashboard/expenses"
                            className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-[#f0f4f7] p-4 transition-colors hover:bg-[#e1e9ee]"
                        >
                            <QrCode className="size-5 text-[#566166] transition-colors group-hover:text-[#006c49]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#566166]">
                                Add Expense
                            </span>
                        </Link>
                        <Link
                            href="/dashboard/expenses"
                            className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-[#f0f4f7] p-4 transition-colors hover:bg-[#e1e9ee]"
                        >
                            <HandCoins className="size-5 text-[#566166] transition-colors group-hover:text-[#006c49]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#566166]">
                                Settle Up
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
