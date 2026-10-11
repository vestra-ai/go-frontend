import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fetchInvitePreview, invitePhoto, optimizedCoverUrl } from "@/lib/inviteOg";

// The page is a client component, so the share text lives here. Messengers read these tags without running the app.
const title = "Go: group trips, planned and booked by AI";
const description =
  "Friends plan in the chat. Go turns it into an itinerary, real bookings and one budget. See the flow and every screen.";

// The picture is the trip's cover when the link's trip has one, else the mascot. It is set here and not by an
// `opengraph-image` file beside this one, because that file would always win over `generateMetadata`.
const mascot = {
  url: "/images/og-invite.png",
  width: 1200,
  height: 630,
  alt: "Go, the trip mascot, waving: you are invited to a group trip",
};

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const preview = await fetchInvitePreview(code);
  // A link that was rotated or whose trip is over is not an invitation any more: it shows no trip's picture.
  const photo = preview?.state === "pending" ? invitePhoto(preview.trip) : null;
  const cover = photo ? optimizedCoverUrl(photo) : null;
  const image = cover && preview ? { url: cover, alt: preview.trip.title } : mascot;
  return {
    title,
    description,
    openGraph: { title, description, siteName: "Go", type: "website", images: [image] },
  };
}

export default function InviteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
