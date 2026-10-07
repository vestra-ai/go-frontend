// Store-owned timers (B-crew.md §1.3: join handles live in the store module so they survive navigation;
// C-chat-kickoff.md §1.5: one Go ack per burst of sends). Never persisted; reset/applyPreset cancel them all.

const handles = new Map<string, ReturnType<typeof setTimeout>>();

export function schedule(key: string, ms: number, run: () => void): void {
  cancel(key);
  handles.set(
    key,
    setTimeout(() => {
      handles.delete(key);
      run();
    }, ms),
  );
}

export function cancel(key: string): void {
  const handle = handles.get(key);
  if (handle !== undefined) clearTimeout(handle);
  handles.delete(key);
}

export function cancelAll(): void {
  handles.forEach((handle) => clearTimeout(handle));
  handles.clear();
}
