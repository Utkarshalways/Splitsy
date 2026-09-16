import type { User } from "@clerk/nextjs/server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

function getPrimaryEmail(user: User): string | null {
  const primary = user.emailAddresses.find(
    (item) => item.id === user.primaryEmailAddressId,
  );
  return (
    primary?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null
  );
}

function getFullName(user: User): string | null {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.username || null;
}

/**
 * Upsert the signed-in Clerk user into Supabase `users`.
 * Primary sync path for local/dev without a Clerk webhook.
 */
export async function ensureUser(user: User): Promise<void> {
  const email = getPrimaryEmail(user);
  if (!email) return;

  const { error } = await getSupabaseAdmin().from("users").upsert(
    {
      clerk_id: user.id,
      email: email.toLowerCase(),
      full_name: getFullName(user),
      image_url: user.imageUrl,
    },
    { onConflict: "clerk_id" },
  );

  if (error) {
    throw new Error(`Failed to sync user to Supabase: ${error.message}`);
  }
}
