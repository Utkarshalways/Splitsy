"use client";

import { useState, useEffect, Suspense } from "react";
import {
    Plus,
    X,
    Receipt,
    Loader2,
    Check,
    Utensils,
    Plane,
    ShoppingCart,
    Home,
    Zap,
    HelpCircle,
} from "lucide-react";

type UserInfo = {
    clerk_id: string;
    email: string;
    full_name: string | null;
    image_url: string | null;
};

type SplitData = {
    id: string;
    transaction_id: string;
    user_id: string;
    amount_owed: number;
    is_paid: boolean;
    user: UserInfo | null;
};

type TransactionData = {
    id: string;
    creator_id: string;
    amount: number;
    description: string;
    category: string;
    created_at: string;
    creator: UserInfo | null;
    splits: SplitData[];
};

type FriendData = {
    id: string;
    friend_id: string;
    friend: UserInfo | null;
};

const categories = [
    { value: "food", label: "Food & Drinks", icon: Utensils },
    { value: "travel", label: "Travel", icon: Plane },
    { value: "shopping", label: "Shopping", icon: ShoppingCart },
    { value: "housing", label: "Housing", icon: Home },
    { value: "utilities", label: "Utilities", icon: Zap },
    { value: "general", label: "General", icon: Receipt },
];

const categoryIcons: Record<string, React.ElementType> = Object.fromEntries(
    categories.map((c) => [c.value, c.icon]),
);

function getCategoryIcon(category: string) {
    return categoryIcons[category] ?? HelpCircle;
}

export default function ExpensesPage() {
    const [transactions, setTransactions] = useState<TransactionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);

    // Add Expense form state
    const [friends, setFriends] = useState<FriendData[]>([]);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("general");
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState("");

    // Settle state
    const [settlingId, setSettlingId] = useState<string | null>(null);

    const fetchTransactions = async () => {
        const res = await fetch("/api/transactions");
        if (res.ok) {
            setTransactions(await res.json());
        }
        setLoading(false);
    };

    const fetchFriends = async () => {
        const res = await fetch("/api/friends");
        if (res.ok) {
            setFriends(await res.json());
        }
    };

    useEffect(() => {
        fetchTransactions();
        fetchFriends();
    }, []);

    const toggleFriend = (friendId: string) => {
        setSelectedFriends((prev) =>
            prev.includes(friendId)
                ? prev.filter((id) => id !== friendId)
                : [...prev, friendId],
        );
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddLoading(true);
        setAddError("");

        const res = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: parseFloat(amount),
                description,
                category,
                splitWith: selectedFriends,
            }),
        });

        const data = await res.json();
        if (!res.ok) {
            setAddError(data.error);
        } else {
            setShowAdd(false);
            setAmount("");
            setDescription("");
            setCategory("general");
            setSelectedFriends([]);
            fetchTransactions();
        }
        setAddLoading(false);
    };

    const handleSettle = async (splitId: string) => {
        setSettlingId(splitId);
        const res = await fetch("/api/settlements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ splitId }),
        });
        if (res.ok) {
            fetchTransactions();
        }
        setSettlingId(null);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#2a3439]">
                        Expenses
                    </h1>
                    <p className="mt-1 text-sm text-[#566166]">
                        Track and manage shared expenses
                    </p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#006c49] to-[#005f40] px-5 py-3 text-sm font-semibold text-[#e1ffec] shadow-[0_10px_24px_rgba(0,108,73,0.18)] transition hover:brightness-105"
                >
                    <Plus className="size-4" />
                    Add Expense
                </button>
            </div>

            {/* Add Expense Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-[#2a3439]">
                                Add Expense
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAdd(false);
                                    setAddError("");
                                }}
                                className="rounded-lg p-1 hover:bg-[#f0f4f7]"
                            >
                                <X className="size-4 text-[#566166]" />
                            </button>
                        </div>

                        <form onSubmit={handleAddExpense} className="space-y-5">
                            {/* Amount */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#a9b4b9]">
                                    Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-[#006c49]">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        required
                                        className="w-full rounded-xl border border-[#a9b4b930] bg-[#f7f9fb] py-3 pl-10 pr-4 text-lg font-bold text-[#2a3439] outline-none transition focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/10"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#a9b4b9]">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Dinner at Le Petit Bistro"
                                    className="w-full rounded-xl border border-[#a9b4b930] bg-[#f7f9fb] px-4 py-3 text-sm text-[#2a3439] outline-none transition focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/10"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#a9b4b9]">
                                    Category
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() => setCategory(cat.value)}
                                            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition ${category === cat.value
                                                ? "bg-[#006c49] text-[#e1ffec]"
                                                : "bg-[#f0f4f7] text-[#566166] hover:bg-[#e1e9ee]"
                                                }`}
                                        >
                                            <cat.icon className="size-3.5" />
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Split With */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#a9b4b9]">
                                    Split with
                                </label>
                                {friends.length === 0 ? (
                                    <p className="rounded-xl bg-[#f7f9fb] p-4 text-center text-xs text-[#a9b4b9]">
                                        No friends yet. Add some friends first!
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {friends.map((f) => (
                                            <button
                                                key={f.friend_id}
                                                type="button"
                                                onClick={() => toggleFriend(f.friend_id)}
                                                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition ${selectedFriends.includes(f.friend_id)
                                                    ? "bg-[#006c49]/10 ring-1 ring-[#006c49]/30"
                                                    : "bg-[#f7f9fb] hover:bg-[#f0f4f7]"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {f.friend?.image_url ? (
                                                        <img
                                                            src={f.friend.image_url}
                                                            alt=""
                                                            className="size-8 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex size-8 items-center justify-center rounded-lg bg-[#006c49]/10 text-xs font-bold text-[#006c49]">
                                                            {(f.friend?.full_name ?? f.friend?.email ?? "?")
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium text-[#2a3439]">
                                                            {f.friend?.full_name ?? "Unknown"}
                                                        </p>
                                                        <p className="text-[10px] text-[#a9b4b9]">
                                                            {f.friend?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                {selectedFriends.includes(f.friend_id) && (
                                                    <div className="flex size-5 items-center justify-center rounded-full bg-[#006c49]">
                                                        <Check className="size-3 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {selectedFriends.length > 0 && amount && (
                                    <p className="mt-2 text-xs text-[#566166]">
                                        Each person pays{" "}
                                        <span className="font-bold text-[#006c49]">
                                            $
                                            {(
                                                parseFloat(amount) /
                                                (selectedFriends.length + 1)
                                            ).toFixed(2)}
                                        </span>{" "}
                                        (split {selectedFriends.length + 1} ways)
                                    </p>
                                )}
                            </div>

                            {addError && (
                                <p className="rounded-lg bg-[#9f403d]/10 px-3 py-2 text-xs font-medium text-[#9f403d]">
                                    {addError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={addLoading || selectedFriends.length === 0}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#006c49] to-[#005f40] py-3 text-sm font-semibold text-[#e1ffec] transition hover:brightness-105 disabled:opacity-60"
                            >
                                {addLoading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <>
                                        <Plus className="size-4" />
                                        Add Expense
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Transactions List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="size-6 animate-spin text-[#006c49]" />
                </div>
            ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-[0_2px_12px_rgba(42,52,57,0.06)]">
                    <div className="mb-4 rounded-2xl bg-[#f0f4f7] p-4">
                        <Receipt className="size-8 text-[#a9b4b9]" />
                    </div>
                    <p className="text-sm font-medium text-[#566166]">
                        No expenses yet
                    </p>
                    <p className="mt-1 text-xs text-[#a9b4b9]">
                        Add your first shared expense
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {transactions.map((tx) => {
                        const Icon = getCategoryIcon(tx.category);
                        return (
                            <div
                                key={tx.id}
                                className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(42,52,57,0.06)]"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="flex size-11 items-center justify-center rounded-xl bg-[#f0f4f7]">
                                            <Icon className="size-5 text-[#006c49]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#2a3439]">
                                                {tx.description || "Untitled expense"}
                                            </p>
                                            <p className="mt-0.5 text-xs text-[#a9b4b9]">
                                                Paid by{" "}
                                                <span className="font-medium text-[#566166]">
                                                    {tx.creator?.full_name ?? "Unknown"}
                                                </span>{" "}
                                                · {new Date(tx.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-[#2a3439]">
                                        ${tx.amount.toFixed(2)}
                                    </p>
                                </div>

                                {/* Splits */}
                                {tx.splits.length > 0 && (
                                    <div className="mt-4 space-y-2 border-t border-[#a9b4b920] pt-4">
                                        {tx.splits.map((split) => (
                                            <div
                                                key={split.id}
                                                className="flex items-center justify-between rounded-xl bg-[#f7f9fb] px-4 py-2.5"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {split.user?.image_url ? (
                                                        <img
                                                            src={split.user.image_url}
                                                            alt=""
                                                            className="size-7 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex size-7 items-center justify-center rounded-lg bg-[#006c49]/10 text-[10px] font-bold text-[#006c49]">
                                                            {(
                                                                split.user?.full_name ??
                                                                split.user?.email ??
                                                                "?"
                                                            )
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className="text-xs font-medium text-[#566166]">
                                                        {split.user?.full_name ?? split.user?.email ?? "Unknown"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`text-xs font-bold ${split.is_paid
                                                            ? "text-[#a9b4b9] line-through"
                                                            : "text-[#9f403d]"
                                                            }`}
                                                    >
                                                        ${split.amount_owed.toFixed(2)}
                                                    </span>
                                                    {split.is_paid ? (
                                                        <span className="rounded-lg bg-[#006c49]/10 px-2 py-0.5 text-[10px] font-bold text-[#006c49]">
                                                            Settled
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSettle(split.id)}
                                                            disabled={settlingId === split.id}
                                                            className="rounded-lg bg-[#006c49] px-2.5 py-1 text-[10px] font-bold text-white transition hover:brightness-110 disabled:opacity-60"
                                                        >
                                                            {settlingId === split.id ? (
                                                                <Loader2 className="size-3 animate-spin" />
                                                            ) : (
                                                                "Settle"
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
