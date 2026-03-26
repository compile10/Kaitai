"use client";

import {
  CircleUser,
  History as HistoryIcon,
  LogOut as LogOutIcon,
  Settings as SettingsIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import HistoryModal from "@/components/HistoryModal";
import SettingsModal from "@/components/SettingsModal";
import { authClient } from "@/lib/auth-client";

interface UserMenuProps {
  name: string;
  email: string;
}

export default function UserMenu({ name, email }: UserMenuProps) {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none"
          >
            <CircleUser className="w-5 h-5" />
            <span>{name || email}</span>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-40 rounded-lg border border-border bg-card p-1 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 duration-150"
          >
            <DropdownMenu.Item
              onSelect={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-card-foreground rounded-md cursor-pointer outline-none hover:bg-muted transition-colors"
            >
              <HistoryIcon className="w-4 h-4" />
              History
            </DropdownMenu.Item>

            <DropdownMenu.Item
              onSelect={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-card-foreground rounded-md cursor-pointer outline-none hover:bg-muted transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
              Settings
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="my-1 h-px bg-border" />

            <DropdownMenu.Item
              onSelect={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-card-foreground rounded-md cursor-pointer outline-none hover:bg-muted transition-colors"
            >
              <LogOutIcon className="w-4 h-4" />
              Logout
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {mounted &&
        createPortal(
          <>
            <HistoryModal
              isOpen={isHistoryOpen}
              onClose={() => setIsHistoryOpen(false)}
            />
            <SettingsModal
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
            />
          </>,
          document.body,
        )}
    </>
  );
}
