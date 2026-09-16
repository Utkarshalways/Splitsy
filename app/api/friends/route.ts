import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureUser } from "@/lib/supabase/ensure-user";
import { NextResponse } from "next/server";

// GET /api/friends — list current user's friends
export async function GET() {
    const user = await currentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUser(user);

    const { data, error } = await getSupabaseAdmin()
        .from("friends")
        .select("id, friend_id, created_at")
        .eq("user_id", user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data ?? [];
    const friendIds = rows.map((f: { friend_id: string }) => f.friend_id);

    if (friendIds.length === 0) {
        return NextResponse.json([]);
    }

    const { data: friendUsers, error: usersError } = await getSupabaseAdmin()
        .from("users")
        .select("clerk_id, email, full_name, image_url")
        .in("clerk_id", friendIds);

    if (usersError) {
        return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const userList = friendUsers ?? [];
    const friends = rows.map((f: { id: string; friend_id: string; created_at: string }) => ({
        ...f,
        friend: userList.find((u: { clerk_id: string }) => u.clerk_id === f.friend_id) ?? null,
    }));

    return NextResponse.json(friends);
}

// POST /api/friends — add a friend by email
export async function POST(req: Request) {
    const user = await currentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUser(user);

    const { email } = await req.json();

    if (!email || typeof email !== "string") {
        return NextResponse.json(
            { error: "Email is required" },
            { status: 400 },
        );
    }

    // Find user by email
    const { data: friendUser, error: findError } = await getSupabaseAdmin()
        .from("users")
        .select("clerk_id")
        .eq("email", email.trim().toLowerCase())
        .single();

    if (findError || !friendUser) {
        return NextResponse.json(
            { error: "No user found with that email" },
            { status: 404 },
        );
    }

    const friendClerkId = (friendUser as { clerk_id: string }).clerk_id;

    if (friendClerkId === user.id) {
        return NextResponse.json(
            { error: "You cannot add yourself as a friend" },
            { status: 400 },
        );
    }

    // Check if already friends
    const { data: existing } = await getSupabaseAdmin()
        .from("friends")
        .select("id")
        .eq("user_id", user.id)
        .eq("friend_id", friendClerkId)
        .single();

    if (existing) {
        return NextResponse.json(
            { error: "Already friends with this user" },
            { status: 409 },
        );
    }

    // Insert bidirectional friendship
    const { error: insertError } = await getSupabaseAdmin().from("friends").insert([
        { user_id: user.id, friend_id: friendClerkId },
        { user_id: friendClerkId, friend_id: user.id },
    ] as never[]);

    if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
