import type { Metadata } from "next";
import type { ReactNode } from "react";

// The page is a client component, so the share text lives here. The picture comes from `opengraph-image.png` beside this file:
// Next adds og:image (and its size and alt) for this route on its own. Messengers read these tags without running the app.
const title = "Go: group trips, planned and booked by AI";
const description =
  "Friends plan in the chat. Go turns it into an itinerary, real bookings and one budget. See the flow and every screen.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, siteName: "Go", type: "website" },
};

export default function InviteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
