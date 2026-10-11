import { ChevronRight } from "@/components/icons/generated";

const shell = "flex w-full items-center gap-3 rounded-2xl bg-white p-2.5 text-left shadow-bubble";

type TicketFileRowProps = {
  /** 'E-ticket BLR-GOX.pdf' · 'Hotel voucher Villa Sol, Anjuna.pdf' */
  name: string;
  /** 'PDF · 92 KB' */
  sub: string;
  /** 'Open E-ticket BLR-GOX.pdf' */
  openLabel: string;
  onOpen: () => void;
};

/**
 * One file of a booking in its sheet, for a file that no leg of the journey (and no stay) has a button for: a tap opens
 * it in the ticket viewer.
 */
export function TicketFileRow({ name, sub, openLabel, onOpen }: TicketFileRowProps) {
  return (
    <button
      type="button"
      aria-label={openLabel}
      onClick={onOpen}
      className={`${shell} cursor-pointer outline-none transition-transform duration-[160ms] ease-[var(--ease-out)] focus-visible:ring-2 focus-visible:ring-ink/25 active:scale-[0.985] active:bg-surface-pressed`}
    >
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-20 leading-none">
        📄
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-15 font-semibold">{name}</span>
        <span className="text-13 text-muted">{sub}</span>
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />
    </button>
  );
}
