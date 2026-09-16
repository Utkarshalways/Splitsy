export type User = {
  clerk_id: string;
  email: string;
  full_name: string | null;
  image_url: string | null;
  created_at: string;
};

export type Friend = {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  creator_id: string;
  amount: number;
  description: string;
  category: string;
  created_at: string;
};

export type Split = {
  id: string;
  transaction_id: string;
  user_id: string;
  amount_owed: number;
  is_paid: boolean;
  created_at: string;
};

/* ── Joined / enriched types used by the UI ── */

export type FriendWithUser = Friend & {
  friend: User;
};

export type SplitWithUser = Split & {
  user: User;
};

export type TransactionWithSplits = Transaction & {
  splits: SplitWithUser[];
  creator: User;
};

/* ── Supabase database type map (for createClient generic) ── */

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "created_at">;
        Update: Partial<Omit<User, "clerk_id">>;
      };
      friends: {
        Row: Friend;
        Insert: Omit<Friend, "id" | "created_at">;
        Update: Partial<Omit<Friend, "id">>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "created_at">;
        Update: Partial<Omit<Transaction, "id">>;
      };
      splits: {
        Row: Split;
        Insert: Omit<Split, "id" | "created_at">;
        Update: Partial<Omit<Split, "id">>;
      };
    };
  };
};
