/** Indian-grouped rupees: inr(21800) -> "₹21,800". */
export function inr(value: number): string {
  return "₹" + value.toLocaleString("en-IN");
}

/** Compact thousands: kFormat(21800) -> "₹21.8k", kFormat(55000) -> "₹55k". */
export function kFormat(value: number): string {
  const k = Math.round((value / 1000) * 10) / 10;
  return `₹${k}k`;
}

/** "Rahul is in" · "Rahul and Priya are in" · "Rahul, Priya and 1 more are in". */
export function formatWhosIn(firstNames: string[]): string {
  const [a, b] = firstNames;
  if (firstNames.length === 0) return "";
  if (firstNames.length === 1) return `${a} is in`;
  if (firstNames.length === 2) return `${a} and ${b} are in`;
  return `${a}, ${b} and ${firstNames.length - 2} more are in`;
}
