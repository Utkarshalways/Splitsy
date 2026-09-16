import { Webhook } from "svix";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ClerkUserData = {
  id: string;
  primary_email_address_id: string | null;
  email_addresses: Array<{ id: string; email_address: string }>;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  image_url: string | null;
};

type ClerkUserCreatedOrUpdatedEvent = {
  type: "user.created" | "user.updated";
  data: ClerkUserData;
};

type ClerkUserDeletedEvent = {
  type: "user.deleted";
  data: { id: string };
};

type ClerkWebhookEvent =
  | ClerkUserCreatedOrUpdatedEvent
  | ClerkUserDeletedEvent
  | {
    type: string;
    data: Record<string, unknown>;
  };

function getPrimaryEmail(event: ClerkUserCreatedOrUpdatedEvent): string | null {

  const primaryEmailId = event.data.primary_email_address_id;
  const primaryEmail = event.data.email_addresses.find((item) => item.id === primaryEmailId);

  return primaryEmail?.email_address ?? event.data.email_addresses[0]?.email_address ?? null;
}

function getFullName(event: ClerkUserCreatedOrUpdatedEvent): string | null {
  const fullName = [event.data.first_name, event.data.last_name].filter(Boolean).join(" ").trim();

  return fullName || event.data.username || null;
}

function isUserCreatedOrUpdatedEvent(event: ClerkWebhookEvent): event is ClerkUserCreatedOrUpdatedEvent {
  return event.type === "user.created" || event.type === "user.updated";
}

export async function POST(req: Request) {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!signingSecret) {
    return Response.json(
      { error: "Missing CLERK_WEBHOOK_SIGNING_SECRET environment variable." },
      { status: 500 },
    );
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: "Missing required Svix headers." }, { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(signingSecret);

  let event: ClerkWebhookEvent;

  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return Response.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    if (event.type === "user.deleted") {
      const clerkId = event.data.id;

      if (!clerkId) {
        return Response.json({ error: "Missing Clerk user id." }, { status: 400 });
      }

      const { error } = await getSupabaseAdmin().from("users").delete().eq("clerk_id", clerkId);

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ ok: true });
    }

    if (isUserCreatedOrUpdatedEvent(event)) {
      const email = getPrimaryEmail(event);

      if (!email) {
        return Response.json({ error: "Missing user email in webhook payload." }, { status: 400 });
      }

      const row = {
        clerk_id: event.data.id,
        email,
        full_name: getFullName(event),
        image_url: event.data.image_url,
      };

      const { error } = await getSupabaseAdmin().from("users").upsert(row, { onConflict: "clerk_id" });

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ ok: true });
    }

    return Response.json({ ignored: true });
  } catch {
    return Response.json({ error: "Failed processing webhook event." }, { status: 500 });
  }
}
