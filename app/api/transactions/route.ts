import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureUser } from "@/lib/supabase/ensure-user";
import { NextResponse } from "next/server";

// GET /api/transactions — list transactions involving the current user
export async function GET() {
    const user = await currentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUser(user);

    // Get transactions I created
    const { data: created } = await getSupabaseAdmin()
        .from("transactions")
        .select("id")
        .eq("creator_id", user.id);

    // Get transaction IDs from splits I'm part of
    const { data: mySplits } = await getSupabaseAdmin()
        .from("splits")
        .select("transaction_id")
        .eq("user_id", user.id);

    const createdIds = created?.map((t) => t.id) ?? [];
    const splitIds = mySplits?.map((s) => s.transaction_id) ?? [];
    const allIds = [...new Set([...createdIds, ...splitIds])];

    if (allIds.length === 0) {
        return NextResponse.json([]);
    }

    const { data: transactions, error } = await getSupabaseAdmin()
        .from("transactions")
        .select("*")
        .in("id", allIds)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch splits for each transaction
    const { data: allSplits } = await getSupabaseAdmin()
        .from("splits")
        .select("*")
        .in("transaction_id", allIds);

    // Fetch all user details for creators and split users
    const userIds = [
        ...new Set([
            ...(transactions?.map((t) => t.creator_id) ?? []),
            ...(allSplits?.map((s) => s.user_id) ?? []),
        ]),
    ];

    const { data: users } = await getSupabaseAdmin()
        .from("users")
        .select("clerk_id, email, full_name, image_url")
        .in("clerk_id", userIds);

    const enriched = transactions?.map((tx) => ({
        ...tx,
        amount: Number(tx.amount),
        creator: users?.find((u) => u.clerk_id === tx.creator_id) ?? null,
        splits: (allSplits ?? [])
            .filter((s) => s.transaction_id === tx.id)
            .map((s) => ({
                ...s,
                amount_owed: Number(s.amount_owed),
                user: users?.find((u) => u.clerk_id === s.user_id) ?? null,
            })),
    }));

    return NextResponse.json(enriched ?? []);
}

// POST /api/transactions — create a transaction with splits
export async function POST(req: Request) {
    const user = await currentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUser(user);

    const { amount, description, category, splitWith } = await req.json();

    if (!amount || !splitWith || !Array.isArray(splitWith) || splitWith.length === 0) {
        return NextResponse.json(
            { error: "Amount and at least one person to split with are required" },
            { status: 400 },
        );
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Total people = creator + friends selected
    const totalPeople = splitWith.length + 1;
    const splitAmount = Math.round((numericAmount / totalPeople) * 100) / 100;

    // Create the transaction
    const { data: transaction, error: txError } = await getSupabaseAdmin()
        .from("transactions")
        .insert({
            creator_id: user.id,
            amount: numericAmount,
            description: description || "",
            category: category || "general",
        })
        .select()
        .single();

    if (txError || !transaction) {
        return NextResponse.json(
            { error: txError?.message ?? "Failed to create transaction" },
            { status: 500 },
        );
    }

    // Create splits for each friend (not the creator — they paid)
    const splits = splitWith.map((friendId: string) => ({
        transaction_id: transaction.id,
        user_id: friendId,
        amount_owed: splitAmount,
        is_paid: false,
    }));

    const { error: splitError } = await getSupabaseAdmin()
        .from("splits")
        .insert(splits);

    if (splitError) {
        // Rollback: delete the transaction
        await getSupabaseAdmin().from("transactions").delete().eq("id", transaction.id);
        return NextResponse.json({ error: splitError.message }, { status: 500 });
    }

    return NextResponse.json(transaction, { status: 201 });
}
