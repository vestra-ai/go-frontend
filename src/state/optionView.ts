import type { DateRange, Decision, DecisionOption, Id, Journey, MyVote, Option, OptionDetailsFull, OptionsCard } from "@/api/contract";
import { details as detailsCopy } from "@/data/seed/copy";
import type { CabOption, DateOption, OptionExtras, PlaceOption, RouteLeg, RouteMode, RouteOption, Stay, StayPhoto } from "@/data/types";
import { daysBetween, formatClock, formatDay, formatDayClock, formatDayRange, formatDayShort, formatHHMM, parseDay, wallTime } from "@/lib/dates";
import { inr, kFormat } from "@/lib/format";
import { httpUrl } from "@/state/bookingView";
import { fromMinor, illustrationFor } from "@/state/view";

// A vote's options (`DecisionOption`) and an options card's options (`Option`) → what the poll rails, the details
// sheets, the route sheet and the cab sheet draw (CONTRACT-APP §5, §7). Every 1.1 / rev 4 field is optional: show
// what is there.

type AnyOption = DecisionOption | Option;

interface Norm {
  name: string;
  subtitle: string;
  highlights: string[];
  image?: string;
  priceMinor?: number | null;
  priceMinMinor?: number | null;
  priceMaxMinor?: number | null;
  priceNote: string;
  /** The card's own `details`, with what the Details route added when it has been read (`withDetails`). */
  details: OptionDetailsFull;
  url?: string | null;
  rating?: number | null;
  refundableUntil?: string | null;
  area: string;
  hasRooms: boolean;
}

function norm(o: AnyOption): Norm {
  const isCard = "option_id" in o;
  const card = isCard ? (o as Option) : null;
  const vote = isCard ? null : (o as DecisionOption);
  return {
    name: card ? card.title : (vote?.label ?? ""),
    subtitle: card ? (card.subtitle ?? "") : (vote?.note ?? ""),
    highlights: card?.highlights ?? [],
    // `photo_url` / `image_url` stay the cover; `photos` are the labelled gallery (§7).
    image: httpUrl(o.image_url) ?? httpUrl(o.photos?.[0]?.url) ?? httpUrl(card?.place?.photo_url) ?? httpUrl(o.details?.gallery_urls?.[0]),
    priceMinor: o.price_minor,
    priceMinMinor: o.price_min_minor,
    priceMaxMinor: o.price_max_minor,
    priceNote: card?.price_note ?? "",
    details: o.details ?? {},
    url: card?.url,
    rating: card?.rating ?? o.details?.rating,
    refundableUntil: card?.refundable_until,
    area: card?.place?.address ?? card?.place?.name ?? "",
    hasRooms: (o.room_types?.length ?? 0) > 0,
  };
}

/** §7: at most 12 `photos`. */
const MAX_PHOTOS = 12;

/**
 * A stay's gallery, cover first: its labelled `photos`, or `details.gallery_urls` when it has none (§7: when both
 * arrive, show `photos`). The cover is the first of `photos` when there are any; one that is not among them leads.
 */
function galleryOf(o: AnyOption, n: Norm): StayPhoto[] {
  const labelled = (o.photos ?? []).map((p) => ({ src: httpUrl(p.url), ...(p.label ? { label: p.label } : {}) }));
  const all = labelled.length > 0 ? labelled : (n.details.gallery_urls ?? []).map((url) => ({ src: httpUrl(url) }));
  const seen = new Set<string>();
  const photos: StayPhoto[] = [];
  for (const photo of all) {
    if (!photo.src || seen.has(photo.src)) continue;
    seen.add(photo.src);
    photos.push({ ...photo, src: photo.src });
  }
  if (n.image && !seen.has(n.image)) photos.unshift({ src: n.image });
  return photos.slice(0, MAX_PHOTOS);
}

const TINTS = ["bg-amber-soft", "bg-info-tint", "bg-info-tint-3", "bg-green-tint", "bg-peach-tint"] as const;

const money = (minor: number) => inr(fromMinor(minor));
const short = (minor: number) => kFormat(fromMinor(minor));

/** "~₹21k each" · "₹9.6k–₹12k each" · "" */
function priceLabel(n: Norm): string {
  // A stay's range is per person for the whole stay (§7).
  if (n.priceMinMinor != null && n.priceMaxMinor != null) {
    return n.priceMinMinor === n.priceMaxMinor ? `${short(n.priceMinMinor)} each` : `${short(n.priceMinMinor)}–${short(n.priceMaxMinor)} each`;
  }
  if (n.priceMinMinor != null) return `from ${short(n.priceMinMinor)} each`;
  if (n.priceMinor != null) return n.priceNote ? `${short(n.priceMinor)} ${n.priceNote}` : short(n.priceMinor);
  return "";
}

/**
 * An option with what `GET …/options/:option_id/details` answered laid over its card's own `details` (§4.7). Every
 * field is optional and Go may still be collecting: a field the answer leaves out or sends empty keeps the card's value.
 */
export function withDetails<T extends AnyOption>(o: T, full: OptionDetailsFull | undefined): T {
  if (!full) return o;
  const filled = Object.fromEntries(Object.entries(full).filter(([, v]) => v != null && !(Array.isArray(v) && v.length === 0)));
  return { ...o, details: { ...(o.details ?? {}), ...filled } };
}

/** "14:00" → "2:00 pm"; a full date-time → "Fri 6 Nov · 2:00 pm"; anything else as Go wrote it. */
function clockOf(value: string): string {
  if (/^\d{1,2}:\d{2}$/.test(value)) return formatHHMM(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value))) return formatDayClock(wallTime(value));
  return value;
}

/** "www.ixigo.com" → "ixigo": the site's own name, for "View on ixigo". */
function siteOf(url: string): string {
  try {
    const labels = new URL(url).hostname.replace(/^www\./, "").split(".");
    const generic = new Set(["co", "com", "org", "net"]);
    const at = labels.length >= 3 && generic.has(labels[labels.length - 2]) ? labels.length - 3 : Math.max(labels.length - 2, 0);
    return labels[at] ?? "";
  } catch {
    return "";
  }
}

/** `address` is a row of its own on a place; a stay shows it under its name instead. */
function extrasOf(n: Norm, withAddress: boolean): OptionExtras | undefined {
  const d = n.details;
  const copy = detailsCopy;
  const type = [d.property_type, d.stars ? copy.stars(d.stars) : null].filter(Boolean).join(" · ");
  const facts = [
    ...(type ? [{ label: copy.type, value: type }] : []),
    ...(d.check_in ? [{ label: copy.checkIn, value: clockOf(d.check_in) }] : []),
    ...(d.check_out ? [{ label: copy.checkOut, value: clockOf(d.check_out) }] : []),
    ...(withAddress && d.address ? [{ label: copy.address, value: d.address }] : []),
  ];
  const map = d.map && Number.isFinite(d.map.lat) && Number.isFinite(d.map.lng) ? d.map : null;
  const href = httpUrl(d.url) ?? httpUrl(n.url);
  const site = href ? siteOf(href) : "";
  if (facts.length === 0 && !map && !href) return undefined;
  return {
    facts,
    ...(map ? { mapHref: `https://www.google.com/maps?q=${map.lat},${map.lng}` } : {}),
    ...(href ? { link: { label: site ? copy.viewOn(site) : copy.view, href } } : {}),
  };
}

/** What kind of rail a vote draws as: photo cards for places and stays, a plain list for everything else. */
export function voteShape(decision: Decision): "stay" | "place" | "list" {
  if (decision.kind === "yesno" || decision.cancels_booking_id) return "list";
  const options = decision.options.map(norm);
  if (!options.every((o) => o.image)) return "list";
  const stayLike = options.some((o) => o.hasRooms || o.priceMinMinor != null || o.rating != null || (o.details.amenities?.length ?? 0) > 0);
  return stayLike ? "stay" : "place";
}

export function toPlaceOption(o: AnyOption, id: string, voters: Id[], seed: string, index: number): PlaceOption {
  const n = norm(o);
  const d = n.details;
  const price = priceLabel(n);
  const meta = n.subtitle || n.highlights.slice(0, 2).join(" · ");
  const why = d.why?.[0] ?? n.highlights[0] ?? "";
  const img = n.image ?? illustrationFor(`${seed}:${id}`, n.name);
  const tint = TINTS[index % TINTS.length];
  const rich = (d.why?.length ?? 0) > 0 || (d.costs?.length ?? 0) > 0;
  const facts = [
    ...(d.facts ?? []),
    ...(price ? [{ label: "Rough cost", value: price }] : []),
    ...(d.cancellation ? [{ label: "Cancellation", value: d.cancellation }] : []),
  ];
  return {
    id,
    name: n.name,
    meta,
    est: price,
    why: why === meta ? "" : why,
    img,
    photo: Boolean(n.image),
    tint,
    voters,
    extras: extrasOf(n, true),
    details: rich
      ? {
          layout: "rich",
          subtitle: d.caption ?? meta,
          hero: { src: img, alt: n.name },
          caption: meta,
          price,
          whyRows: d.why ?? [],
          cost: (d.costs ?? []).map((c) => ({ label: c.label, emoji: c.emoji ?? "", value: money(c.amount_minor) })),
          total: d.total_minor != null ? money(d.total_minor) : price,
          activities: d.activities ?? [],
          votersLine: "",
        }
      : { layout: "light", subtitle: d.caption ?? meta, tint, img, facts, goNote: d.go_note ?? "" },
  };
}

export interface StayContext {
  dates?: DateRange | null;
  people: number;
  seed: string;
}

export function toStay(o: AnyOption, id: string, voters: Id[], ctx: StayContext): Stay {
  const n = norm(o);
  const d = n.details;
  let dates = "";
  if (ctx.dates) {
    const start = parseDay(ctx.dates.start);
    const end = parseDay(ctx.dates.end);
    const nights = daysBetween(start, end);
    dates = `${formatDayRange(start, end).replace(" – ", " → ")}${nights > 0 ? ` · ${nights} ${nights === 1 ? "night" : "nights"}` : ""}`;
  }
  const total = d.total_minor ?? (n.priceNote ? null : n.priceMinor);
  const share = n.priceMinMinor != null ? priceLabel(n) : total != null && ctx.people > 0 ? `${money(Math.round(total / ctx.people))} each` : "";
  return {
    id,
    name: n.name,
    area: n.area || n.subtitle,
    areaLong: d.address ?? (n.area || n.subtitle),
    // The photo's pill is the price and the rating alone: the Server's `price_note` ("per night, per room, …") can run long.
    priceLabel: priceLabel({ ...n, priceNote: "" }),
    rating: n.rating != null ? String(n.rating) : "",
    reviews: d.review_count != null ? `${d.review_count} reviews` : "",
    tags: n.highlights.slice(0, 2).join(" · ") || (d.amenities ?? []).slice(0, 2).join(" · "),
    img: n.image ?? illustrationFor(`${ctx.seed}:${id}`, n.name),
    photos: galleryOf(o, n),
    amenities: d.amenities ?? n.highlights,
    dates,
    totalFor4: total != null ? money(total) : "",
    yourShare: share,
    cancellation: d.cancellation ?? (n.refundableUntil ? `Free cancellation till ${formatDay(wallTime(n.refundableUntil))}` : ""),
    voters,
    extras: extrasOf(n, false),
  };
}

const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";
const DATE_RANGE = new RegExp(`(\\d{1,2})(?:\\s+(?:${MONTHS})[a-z]*)?\\s*[–-]\\s*(?:[a-z]{3}\\s+)?(\\d{1,2})\\s+(${MONTHS})`, "i");

/** A plain option row. The calendar tile only shows when the label reads as a date range ("Fri 6 – Mon 9 Nov"). */
export function toDateOption(o: DecisionOption, id: string, voters: Id[]): DateOption {
  const m = DATE_RANGE.exec(o.label);
  return {
    id,
    name: o.label,
    ...(m ? { month: m[3].toUpperCase(), range: `${m[1]}–${m[2]}` } : {}),
    meta: o.note ?? "",
    fit: o.price_minor != null ? money(o.price_minor) : "",
    fitTone: "muted",
    voters,
  };
}

// ---------------------------------------------------------------------------
// An options card that is a vote (§4.7)
// ---------------------------------------------------------------------------

export interface CardVote {
  decisionId: Id;
  open: boolean;
  /** The card option I voted for, when it is one of this card's (the vote can span several of Go's messages). */
  mine: Id | null;
  /** `option_id` → its `option_index` in the decision; undefined for an option the decision does not hold. */
  indexOf(optionId: Id): number | undefined;
  /** Who voted for an option, without me (the rails add me to my pick). Empty in an anonymous vote. */
  votersOf(optionId: Id): Id[];
  /** The option's tally when the voters are not named. */
  tallyOf(optionId: Id): number | undefined;
  /** The winning option's name once the vote has closed with a result. */
  winner?: string;
}

/**
 * The vote an options card carries: the card option with `option_id` X is the decision option whose `option_ref` is X,
 * and that one's place in `decision.options` is the `option_index` to vote with.
 */
export function cardVote(decision: Decision, card: OptionsCard, mine: MyVote | undefined, meId: Id): CardVote {
  const index = new Map<Id, number>();
  decision.options.forEach((o, i) => {
    if (o.option_ref) index.set(o.option_ref, i);
  });
  // My vote: what the single-vote routes said, else my row in a vote that names its voters.
  const my = mine !== undefined ? mine : (decision.votes?.find((v) => v.person_id === meId) ?? null);
  const myIndex = my && "option_index" in my ? my.option_index : null;
  return {
    decisionId: decision.decision_id,
    open: decision.status === "open",
    mine: myIndex === null ? null : (card.options.find((o) => index.get(o.option_id) === myIndex)?.option_id ?? null),
    indexOf: (optionId) => index.get(optionId),
    votersOf: (optionId) => {
      const at = index.get(optionId);
      return at === undefined ? [] : (decision.votes ?? []).filter((v) => v.option_index === at && v.person_id !== meId).map((v) => v.person_id);
    },
    tallyOf: (optionId) => {
      const at = index.get(optionId);
      return decision.votes || at === undefined ? undefined : decision.tally[at];
    },
    winner: decision.result_index != null ? decision.options[decision.result_index]?.label : undefined,
  };
}

// ---------------------------------------------------------------------------
// Options cards: flights, trains, buses, cabs (§4.7)
// ---------------------------------------------------------------------------

const stop = (s: Journey["origin"]) => s.code ?? s.name;

function duration(j: Journey): string {
  const minutes = Math.round((Date.parse(j.arrive_at) - Date.parse(j.depart_at)) / 60000);
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

function toLeg(j: Journey): RouteLeg {
  const depart = wallTime(j.depart_at);
  const arrive = wallTime(j.arrive_at);
  const plus = daysBetween(depart, arrive);
  const stops = j.stops ?? 0;
  const logo = httpUrl(j.logo_url);
  return {
    code: `${stop(j.origin)} → ${stop(j.destination)}`,
    day: formatDayShort(depart),
    time: `${formatClock(depart)} → ${formatClock(arrive)}${plus > 0 ? ` +${plus}` : ""}`,
    meta: [j.carrier_name ?? j.number, j.mode === "flight" ? (stops === 0 ? "nonstop" : `${stops} ${stops === 1 ? "stop" : "stops"}`) : null, duration(j)]
      .filter(Boolean)
      .join(" · "),
    h: depart.getHours(),
    ...(logo ? { logoUrl: logo } : {}),
    ...(j.carrier_name ? { carrierName: j.carrier_name } : {}),
  };
}

/** One travel option of an options card. `one` / `round` are whole rupees; an option without a return is one way only. */
export function toRouteOption(o: Option): RouteOption | null {
  const j = o.journey;
  if (!j || j.mode === "cab") return null;
  const legs = [toLeg(j), ...(o.return_journey ? [toLeg(o.return_journey)] : [])];
  const stops = (j.stops ?? 0) + (o.return_journey?.stops ?? 0);
  const one = o.price_oneway_minor ?? o.price_minor ?? 0;
  const round = o.price_round_minor ?? (o.return_journey ? (o.price_minor ?? 0) : 0);
  return {
    id: o.option_id,
    mode: j.mode as RouteMode,
    kind: j.mode === "flight" ? (stops === 0 ? "nonstop" : "stop") : "all",
    tag: o.highlights.join(" · ") || o.title,
    quiet: o.highlights.length === 0,
    one: fromMinor(one),
    round: fromMinor(round),
    // No one-way price of its own: the option is the round trip.
    roundOnly: Boolean(o.return_journey) && o.price_oneway_minor == null && o.price_round_minor == null,
    legs,
  };
}

export interface RouteCardModel {
  cardId: Id;
  title: string;
  options: RouteOption[];
  /** The card's per-option button (`pick`): what "Book" sends. Null: the card has no such button for me. */
  action: { actionId: string; label: string } | null;
  /** Some option carries a return leg. */
  hasReturn: boolean;
}

/** The per-option button I may press on a Go card: shown only to `only_for_person_ids` (absent = everyone). */
export function optionAction(card: OptionsCard, meId: Id): { actionId: string; label: string } | null {
  const action = (card.actions ?? []).find((a) => a.per_option && (!a.only_for_person_ids || a.only_for_person_ids.includes(meId)));
  return action ? { actionId: action.action_id, label: action.label } : null;
}

export function toRouteCard(card: OptionsCard, meId: Id): RouteCardModel {
  const options = card.options.flatMap((o) => toRouteOption(o) ?? []);
  return { cardId: card.card_id, title: card.title, options, action: optionAction(card, meId), hasReturn: options.some((o) => o.legs.length > 1) };
}

export interface CabLeg {
  eyebrow: string;
  value: string;
  meta: string;
}

export interface CabCardModel {
  cardId: Id;
  title: string;
  options: CabOption[];
  legs: CabLeg[];
  action: { actionId: string; label: string } | null;
}

const cabLeg = (j: Journey, label: string): CabLeg => {
  const at = wallTime(j.depart_at);
  return { eyebrow: `${label} · ${formatDay(at).toUpperCase()}`, value: `${j.origin.name} → ${j.destination.name}`, meta: formatClock(at) };
};

export function toCabCard(card: OptionsCard, meId: Id): CabCardModel {
  const first = card.options[0];
  const legs = [
    ...(first?.journey ? [cabLeg(first.journey, "PICKUP")] : []),
    ...(first?.return_journey ? [cabLeg(first.return_journey, "DROP")] : []),
  ];
  const options = card.options.map((o): CabOption => {
    const suv = /suv|innova|6[- ]seat|xl/i.test(`${o.title} ${o.subtitle ?? ""}`);
    const one = o.price_oneway_minor ?? o.price_minor ?? 0;
    return {
      id: o.option_id,
      kind: suv ? "suv" : "sedan",
      emoji: suv ? "🚙" : "🚗",
      title: o.title,
      meta: o.subtitle ?? o.highlights.join(" · "),
      one: fromMinor(one),
      round: fromMinor(o.price_round_minor ?? (o.return_journey ? (o.price_minor ?? 0) : 0)),
    };
  });
  return { cardId: card.card_id, title: card.title, options, legs, action: optionAction(card, meId) };
}
