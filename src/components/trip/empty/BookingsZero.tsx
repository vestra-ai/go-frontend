import { TicketStubPlaceholder } from "@/components/trip/TicketStubPlaceholder";
import { planZero } from "@/data/seed/copy";
import type { TripId } from "@/data/types";

const copy = planZero.bookings;

/** Bookings tab with nothing booked: intro plus three ticket-stub placeholders. */
export function BookingsZero({ tripId }: { tripId: TripId }) {
  return (
    <>
      <div className="flex flex-col gap-0.5 px-1 pt-1 pb-0.5">
        <h2 className="text-20 font-semibold tracking-h3">{copy.title}</h2>
        {/* DESIGN-ASSUMPTION: the design declares 13 then 14 for this line; 14 wins (I-plan-empty.md §1.3). */}
        <p className="text-14 leading-[1.35] tracking-caption text-muted">{copy.body}</p>
      </div>
      {copy.stubs.map((stub) => (
        <TicketStubPlaceholder
          key={stub.key}
          emoji={stub.emoji}
          eyebrow={stub.eyebrow}
          title={stub.title}
          // Bookings are made with Go in the room: every stub opens the trip chat.
          action={{ label: stub.action, href: `/trips/${tripId}/chat` }}
        />
      ))}
    </>
  );
}
