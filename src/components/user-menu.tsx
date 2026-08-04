'use client';

import Image from 'next/image';
import Link from 'next/link';
import { DropdownMenu } from 'radix-ui';
import { LogOut, Map, Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionUser } from '@/server/auth-guards';

const itemClass =
  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none select-none data-[highlighted]:bg-secondary';

export function UserMenu({
  user,
  signOutAction,
}: {
  user: SessionUser;
  signOutAction: () => Promise<void>;
}) {
  const label = user.name ?? user.email ?? 'Account';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-label="Account menu"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-full border object-cover"
          />
        ) : (
          <span className="bg-secondary text-secondary-foreground flex size-9 items-center justify-center rounded-full border">
            <User className="size-4" />
          </span>
        )}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            'bg-popover text-popover-foreground z-50 min-w-56 rounded-lg border p-1.5 shadow-lg',
            'data-[state=open]:animate-fade-up',
          )}
        >
          <div className="border-b px-2 py-2">
            <p className="truncate text-sm font-medium">{label}</p>
            {user.email && user.name ? (
              <p className="text-muted-foreground truncate text-xs">{user.email}</p>
            ) : null}
          </div>

          <div className="pt-1">
            <DropdownMenu.Item asChild>
              <Link href="/plan" className={itemClass}>
                <Plus className="size-4" /> Plan a trip
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <Link href="/trips" className={itemClass}>
                <Map className="size-4" /> My trips
              </Link>
            </DropdownMenu.Item>
          </div>

          <DropdownMenu.Separator className="bg-border my-1 h-px" />

          {/*
            Sign-out is a server action, so the session row is deleted in the
            database. The legacy version called `localStorage.clear()` and then
            `window.location.reload()`, which cleared nothing server-side
            because there was nothing server-side to clear.
          */}
          <form action={signOutAction}>
            <DropdownMenu.Item asChild>
              <button type="submit" className={cn(itemClass, 'text-destructive w-full')}>
                <LogOut className="size-4" /> Sign out
              </button>
            </DropdownMenu.Item>
          </form>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
