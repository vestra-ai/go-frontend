"use client";

import type { ReactNode } from "react";
import { MenuItem } from "@/components/common/MenuItem";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { chat as copy } from "@/data/seed/copy";
import type { AttachItem } from "@/data/types";

type AttachMenuProps = {
  open: boolean;
  onOpenChange(open: boolean): void;
  /** The caller sends the matching canned message (`attachSends[tripId]`, same row order). */
  onPick(item: AttachItem): void;
  /** The trigger (the composer's + button). */
  children: ReactNode;
};

/** 220px attach menu above the + button: Photo, Ticket or PDF, Location, Poll. Picking a row closes it. */
export function AttachMenu({ open, onOpenChange, onPick, children }: AttachMenuProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      {/* With a 24px safe area the menu's bottom edge sits 84px above the frame bottom. */}
      <DropdownMenuContent side="top" align="start" sideOffset={12}>
        {copy.attach.map((row) => (
          <DropdownMenuItem key={row.id} asChild onSelect={() => onPick(row.id)}>
            <MenuItem label={row.label} icon={row.emoji} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
