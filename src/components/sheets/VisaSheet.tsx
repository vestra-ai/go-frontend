"use client";

import { toast } from "sonner";
import { CheckBadge } from "@/components/common/CheckBadge";
import { EmojiTile } from "@/components/common/EmojiTile";
import { InputField } from "@/components/common/InputField";
import { ListRow } from "@/components/common/ListRow";
import { BottomSheet, SheetBody, SheetFooter, SheetHeader, TrustLine } from "@/components/shell/BottomSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { baliVisa } from "@/data/seed/visa";
import type { VisaFieldKey, VisaUploadKey } from "@/data/types";
import { UploadTile } from "./UploadTile";

type VisaSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  copy: typeof baliVisa.sheet;
  uploads: Record<VisaUploadKey, boolean>;
  fields: Record<VisaFieldKey, string>;
  onUpload: (key: VisaUploadKey) => void;
  onFieldChange: (key: VisaFieldKey, value: string) => void;
  onSend: () => void;
};

/** G3 "Your visa details": props-driven; the page binds the store (G-bali.md §1.4). */
export function VisaSheet({ open, onOpenChange, copy, uploads, fields, onUpload, onFieldChange, onSend }: VisaSheetProps) {
  const field = (key: VisaFieldKey) => {
    const spec = copy.fields.find((f) => f.key === key)!;
    return (
      <InputField
        key={key}
        shape="field"
        type="text"
        label={<span className="px-1">{spec.caption}</span>}
        placeholder={spec.placeholder}
        value={fields[key]}
        onChange={(e) => onFieldChange(key, e.target.value)}
      />
    );
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} top={250} aria-label={copy.title}>
      <SheetBody className="pb-[150px]">
        <SheetHeader title={copy.title} subtitle={copy.sub} />
        <div className="flex gap-2.5">
          {copy.uploads.map((u) => (
            <UploadTile
              key={u.key}
              title={u.title}
              sub={u.sub}
              pressed={uploads[u.key]}
              onPress={() => {
                onUpload(u.key);
                toast(u.toast);
              }}
            />
          ))}
        </div>
        {field("name")}
        {field("passport")}
        <div className="grid grid-cols-2 gap-2.5">
          {field("dob")}
          {field("expiry")}
        </div>
        <p className="px-1 text-13 text-muted">{copy.hint}</p>
        <Card variant="outline" radius="lg" className="px-3.5">
          <ListRow
            leading={<EmojiTile emoji={copy.returnFlight.emoji} size={36} shape="circle" />}
            title={copy.returnFlight.title}
            sub={copy.returnFlight.sub}
            trailing={<CheckBadge size={22} />}
          />
        </Card>
      </SheetBody>
      <SheetFooter>
        <Button type="button" variant="primary" size="xl" className="w-full" onClick={onSend}>
          {copy.cta}
        </Button>
        <TrustLine>{copy.trust}</TrustLine>
      </SheetFooter>
    </BottomSheet>
  );
}
