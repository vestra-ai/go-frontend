import { getPreset } from "@/data/presets";
import { buildPresetData } from "@/store/presets";
import { createInitialData } from "@/store/state";
import { cancelAll } from "@/store/timers";
import type { SliceCreator } from "@/store/types";

// Prototype controls (PLAN §9.6).
export interface DemoActions {
  /** Resets to the initial store, applies the artboard's descriptor and returns its href (route + query). */
  applyPreset(id: string): string;
  /** "Reset demo": initial store (signed out, no trips) and the persisted copy removed. */
  resetDemo(): void;
}

const FALLBACK_HREF = "/home";

export const createDemoSlice: SliceCreator<DemoActions> = (set, _get, api) => ({
  applyPreset: (id) => {
    const preset = getPreset(id);
    if (!preset) return FALLBACK_HREF;
    cancelAll();
    set(buildPresetData(preset));
    return preset.href;
  },
  resetDemo: () => {
    cancelAll();
    set(createInitialData());
    api.persist?.clearStorage(); // absent where storage is unavailable (server render)
  },
});
