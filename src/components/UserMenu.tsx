"use client";

import { LogOut as LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface UserMenuProps {
  name: string;
  email: string;
}

export default function UserMenu({ name, email }: UserMenuProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">
        {name || email}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOutIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
