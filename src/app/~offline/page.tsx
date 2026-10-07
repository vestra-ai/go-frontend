import { Screen } from "@/components/shell/Screen";

export default function OfflinePage() {
  return (
    <Screen scroll="none">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <span aria-hidden className="text-44">🧳</span>
        <h1 className="text-26 font-semibold text-ink">You&apos;re offline</h1>
        <p className="text-15 text-muted">Go needs a connection to plan with the group. Reconnect and we&apos;ll pick up where you left off.</p>
      </div>
    </Screen>
  );
}
