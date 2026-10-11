"use client";

import { notFound, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { InvitePreview } from "@/api/contract";
import { api } from "@/api/endpoints";
import { errorMessage, isApiError } from "@/api/http";
import { TripHomeSkeleton } from "@/components/home/TripHomeSkeleton";
import { InviteSheet } from "@/components/sheets/InviteSheet";
import { Screen } from "@/components/shell/Screen";
import { invite as copy } from "@/data/seed/copy";
import type { Invite, Trip } from "@/data/types";
import { signInWithGoogle } from "@/lib/auth";
import { toastGo } from "@/lib/toast";
import { acceptInvite, useSession } from "@/state";
import { illustrationFor, toTripDates, toUser } from "@/state/view";

/** The trip card in the sheet, from the public preview (no trip read: the visitor is not a member yet). */
function previewTrip(preview: InvitePreview): Trip {
  const { trip } = preview;
  const place = trip.destination?.name;
  const photo = trip.photo_url ?? trip.destination?.photo_url ?? undefined;
  const cover = photo ? { src: photo, alt: place ?? trip.title } : undefined;
  return {
    id: trip.trip_id,
    name: trip.title,
    ...(place ? { destination: place } : {}),
    emoji: "🧳",
    ...(trip.dates ? { dates: toTripDates(trip.dates) } : {}),
    ...(cover ? { cover, hero: cover } : {}),
    illustration: illustrationFor(trip.trip_id, place ?? trip.title),
    tint: "info",
    tintClass: "bg-info-tint",
    memberIds: preview.people_preview.map((p) => p.person_id),
    organizerId: preview.people_preview[0]?.person_id ?? preview.inviter.person_id,
    inviteCode: preview.code,
    inviteUrl: "",
    whatsappGroup: trip.title,
    stage: "new",
    homeCard: { coverTitle: trip.title, coverSub: "" },
  };
}

// Set when a signed-out visitor taps "Accept & join" and leaves for Google, so the page they come back to knows that tap
// already happened. A visitor who was signed in all along has no mark and taps Accept themselves.
const SIGN_IN_MARK = "go:invite-sign-in";

function markSignIn(code: string) {
  try {
    sessionStorage.setItem(SIGN_IN_MARK, code);
  } catch {
    // Storage blocked: they come back to the sheet and tap Accept again.
  }
}

function clearSignInMark() {
  try {
    sessionStorage.removeItem(SIGN_IN_MARK);
  } catch {
    // Nothing to clear.
  }
}

/** True once for the invite the visitor tapped "Accept & join" on before signing in. */
function takeSignInMark(code: string): boolean {
  try {
    const marked = sessionStorage.getItem(SIGN_IN_MARK) === code;
    if (marked) sessionStorage.removeItem(SIGN_IN_MARK);
    return marked;
  } catch {
    return false;
  }
}

/**
 * A friend taps an invite link (CONTRACT-APP §4.3). Everyone sees the public preview and taps "Accept & join" themselves.
 * A signed-in visitor is accepted by that tap; a signed-out one signs in from it and is accepted on the way back.
 */
export function InviteScreen({ code }: { code: string }) {
  const router = useRouter();
  const session = useSession();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [missing, setMissing] = useState(false);
  const [pending, setPending] = useState(false);
  const accepting = useRef(false);
  // Where sign-in comes back to: the invite itself, so the visitor is accepted on return.
  const path = `/invite/${encodeURIComponent(code)}`;

  const accept = useCallback(() => {
    if (accepting.current) return;
    accepting.current = true;
    setPending(true);
    acceptInvite(code)
      .then((res) => router.replace(res.landing === "chat" ? `/trips/${res.trip_id}/chat` : `/trips/${res.trip_id}`))
      .catch((err) => {
        // 409: the link was rotated or the trip is over. Anything else: let them tap again.
        accepting.current = false;
        setPending(false);
        toastGo(errorMessage(err, copy.failed));
        if (isApiError(err) && err.status === 409) router.replace("/home");
      });
  }, [code, router]);

  // The preview is public; a signed-in read personalises `state`, so read it again once the session is known.
  useEffect(() => {
    if (session === "loading") return;
    let cancelled = false;
    api
      .invite(code)
      .then((res) => {
        if (!cancelled) setPreview(res);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isApiError(err) && err.status === 404) setMissing(true);
        else toastGo(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [code, session]);

  const state = preview?.state;
  const tripId = preview?.trip.trip_id;

  useEffect(() => {
    if (!state || !tripId) return;
    if (state === "expired" || state === "revoked") {
      toastGo(copy.gone);
      router.replace(session === "signedIn" ? "/home" : "/");
      return;
    }
    if (session !== "signedIn" || accepting.current) return;
    const cameFromSignIn = takeSignInMark(code);
    if (state === "already_member") {
      router.replace(`/trips/${tripId}`);
      return;
    }
    // Back from the sign-in that "Accept & join" started: finish the join. Otherwise the visitor taps Accept themselves.
    if (cameFromSignIn) accept();
  }, [state, tripId, session, code, router, accept]);

  if (missing) notFound();
  if (!preview) return <Screen>{null}</Screen>;

  const trip = previewTrip(preview);
  const inviter = toUser(preview.inviter);
  const members = preview.people_preview.map((p) => toUser(p));
  const invite: Invite = {
    code: preview.code,
    tripId: trip.id,
    inviterId: inviter.id,
    joinedCount: preview.joined_count,
    memberIds: members.map((m) => m.id),
    whenYouJoin: [...copy.whenYouJoinRows],
    cardSub: "",
    membersLine: "",
  };
  const media = trip.cover
    ? { kind: "photo" as const, ...trip.cover }
    : { kind: "illustration" as const, src: trip.illustration ?? "", alt: trip.name };

  return (
    <Screen>
      <TripHomeSkeleton
        tripId={trip.id}
        city={trip.destination ?? trip.name}
        dateShort={trip.dates?.short ?? ""}
        joinedCount={preview.joined_count}
        members={members}
        hero={trip.hero}
      />
      <InviteSheet
        open
        invite={invite}
        trip={trip}
        inviter={inviter}
        members={members}
        media={media}
        pending={pending || session === "loading"}
        notNow={false}
        onAccept={() => {
          // Signed in: this tap is the accept. Signed out: sign in, then come back here to be accepted.
          if (session === "signedIn") return accept();
          if (session !== "signedOut") return;
          setPending(true);
          markSignIn(code);
          signInWithGoogle(path).catch(() => {
            clearSignInMark();
            setPending(false);
            toastGo(copy.failed);
          });
        }}
        onDismiss={() => router.replace(session === "signedIn" ? "/home" : "/")}
      />
    </Screen>
  );
}
