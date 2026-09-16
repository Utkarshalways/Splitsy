"use client";

import { useState, useEffect } from "react";
import { UserPlus, Search, X, UserCheck, Loader2 } from "lucide-react";

type FriendData = {
    id: string;
    friend_id: string;
    created_at: string;
    friend: {
        clerk_id: string;
        email: string;
        full_name: string | null;
        image_url: string | null;
    } | null;
};

export default function FriendsPage() {
    const [friends, setFriends] = useState<FriendData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [email, setEmail] = useState("");
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState("");
    const [addSuccess, setAddSuccess] = useState(false);

    const fetchFriends = async () => {
        const res = await fetch("/api/friends");
        if (res.ok) {
            setFriends(await res.json());
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFriends();
    }, []);

    const handleAddFriend = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddLoading(true);
        setAddError("");
        setAddSuccess(false);

        const res = await fetch("/api/friends", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim() }),
        });

        const data = await res.json();

        if (!res.ok) {
            setAddError(data.error);
        } else {
            setAddSuccess(true);
            setEmail("");
            fetchFriends();
            setTimeout(() => {
                setShowAdd(false);
                setAddSuccess(false);
            }, 1500);
        }
        setAddLoading(false);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#2a3439]">
                        Friends
                    </h1>
                    <p className="mt-1 text-sm text-[#566166]">
                        Manage your Splitsy connections
                    </p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#006c49] to-[#005f40] px-5 py-3 text-sm font-semibold text-[#e1ffec] shadow-[0_10px_24px_rgba(0,108,73,0.18)] transition hover:brightness-105"
                >
                    <UserPlus className="size-4" />
                    Add Friend
                </button>
            </div>

            {/* Add Friend Modal */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-[#2a3439]">Add Friend</h2>
                            <button
                                onClick={() => {
                                    setShowAdd(false);
                                    setAddError("");
                                    setAddSuccess(false);
                                }}
                                className="rounded-lg p-1 hover:bg-[#f0f4f7]"
                            >
                                <X className="size-4 text-[#566166]" />
                            </button>
                        </div>

                        <form onSubmit={handleAddFriend} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="friend-email"
                                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#a9b4b9]"
                                >
                                    Email address
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#a9b4b9]" />
                                    <input
                                        id="friend-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="friend@example.com"
                                        required
                                        className="w-full rounded-xl border border-[#a9b4b930] bg-[#f7f9fb] py-3 pl-10 pr-4 text-sm text-[#2a3439] outline-none transition focus:border-[#006c49] focus:ring-2 focus:ring-[#006c49]/10"
                                    />
                                </div>
                            </div>

                            {addError && (
                                <p className="rounded-lg bg-[#9f403d]/10 px-3 py-2 text-xs font-medium text-[#9f403d]">
                                    {addError}
                                </p>
                            )}

                            {addSuccess && (
                                <p className="rounded-lg bg-[#006c49]/10 px-3 py-2 text-xs font-medium text-[#006c49]">
                                    Friend added successfully!
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={addLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#006c49] to-[#005f40] py-3 text-sm font-semibold text-[#e1ffec] transition hover:brightness-105 disabled:opacity-60"
                            >
                                {addLoading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <>
                                        <UserPlus className="size-4" />
                                        Add Friend
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Friends List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="size-6 animate-spin text-[#006c49]" />
                </div>
            ) : friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-[0_2px_12px_rgba(42,52,57,0.06)]">
                    <div className="mb-4 rounded-2xl bg-[#f0f4f7] p-4">
                        <UserPlus className="size-8 text-[#a9b4b9]" />
                    </div>
                    <p className="text-sm font-medium text-[#566166]">No friends yet</p>
                    <p className="mt-1 text-xs text-[#a9b4b9]">
                        Add your first friend by their email address
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {friends.map((f) => (
                        <div
                            key={f.id}
                            className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(42,52,57,0.06)]"
                        >
                            <div className="flex items-center gap-4">
                                {f.friend?.image_url ? (
                                    <img
                                        src={f.friend.image_url}
                                        alt={f.friend.full_name ?? "Friend"}
                                        className="size-11 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#006c49]/10 text-sm font-bold text-[#006c49]">
                                        {(f.friend?.full_name ?? f.friend?.email ?? "?")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-[#2a3439]">
                                        {f.friend?.full_name ?? "Unknown"}
                                    </p>
                                    <p className="text-xs text-[#a9b4b9]">
                                        {f.friend?.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 rounded-lg bg-[#006c49]/10 px-2.5 py-1">
                                <UserCheck className="size-3 text-[#006c49]" />
                                <span className="text-[10px] font-semibold text-[#006c49]">
                                    Friends
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
