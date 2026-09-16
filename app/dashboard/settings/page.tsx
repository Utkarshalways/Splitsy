import { currentUser } from "@clerk/nextjs/server";
import { UserProfile } from "@clerk/nextjs";

export default async function SettingsPage() {
    const user = await currentUser();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#2a3439]">
                    Settings
                </h1>
                <p className="mt-1 text-sm text-[#566166]">
                    Manage your account and preferences
                </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(42,52,57,0.06)]">
                <UserProfile
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            cardBox: "w-full shadow-none",
                            card: "shadow-none",
                        },
                    }}
                />
            </div>
        </div>
    );
}
