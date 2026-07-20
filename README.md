# Next.js template

This is a Next.js template with shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```

## Clerk -> Supabase user sync

The app includes a Clerk webhook endpoint at `/api/webhooks/clerk` that syncs users into `public.users`.

### 1) Required environment variables

Copy `.env.example` into `.env.local` and set:

- `CLERK_WEBHOOK_SIGNING_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

Keep the service role key server-only. Never expose it with a `NEXT_PUBLIC_` prefix.

### 2) Webhook events in Clerk

In Clerk Dashboard -> Webhooks:

- Endpoint: `https://your-domain.com/api/webhooks/clerk`
- Subscribe to: `user.created`, `user.updated`, `user.deleted`

### 3) Supabase RLS for users table

If you enable RLS on `public.users`, add a read policy for authenticated users.

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read users"
ON public.users
FOR SELECT
TO authenticated
USING (true);
```

This allows querying people for friend search while write operations remain controlled by the service role webhook.
