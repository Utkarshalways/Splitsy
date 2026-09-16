import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureUser } from "@/lib/supabase/ensure-user";
import { NextResponse } from "next/server";

// POST /api/settlements — mark a split as paid
export async function POST(req: Request) {
    const user = await currentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUser(user);

    const { splitId } = await req.json();

    if (!splitId) {
        return NextResponse.json(
            { error: "splitId is required" },
            { status: 400 },
        );
    }

    // Verify the split belongs to the user or the user is the transaction creator
    const { data: split, error: fetchError } = await getSupabaseAdmin()
        .from("splits")
        .select("id, user_id, transaction_id")
        .eq("id", splitId)
        .single();

    if (fetchError || !split) {
        return NextResponse.json(
            { error: "Split not found" },
            { status: 404 },
        );
    }

    // Check if user is either the payer (split owner) or the transaction creator
    const { data: transaction } = await getSupabaseAdmin()
        .from("transactions")
        .select("creator_id")
        .eq("id", split.transaction_id)
        .single();

    if (
        split.user_id !== user.id &&
        transaction?.creator_id !== user.id
    ) {
        return NextResponse.json(
            { error: "You can only settle your own splits or splits for your transactions" },
            { status: 403 },
        );
    }

    const { error: updateError } = await getSupabaseAdmin()
        .from("splits")
        .update({ is_paid: true })
        .eq("id", splitId);

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
