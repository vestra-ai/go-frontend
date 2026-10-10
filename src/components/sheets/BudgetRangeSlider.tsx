import { Slider } from "@/components/ui/slider";
import { budgetSheet as copy } from "@/data/seed/copy";
import { BUDGET_RANGE } from "@/data/seed/money";
import { kFormat } from "@/lib/format";

type BudgetRangeSliderProps = {
  /** One thumb (the group's budget per person) or two (a range). */
  value: number[];
  onValueChange: (value: number[]) => void;
};

/**
 * Two-thumb ₹5k–₹60k slider, ₹1k steps; the thumbs never cross or come closer than ₹1k.
 * Radix keeps the fill on the thumb centres, so the design's calc() fill is not reproduced.
 */
export function BudgetRangeSlider({ value, onValueChange }: BudgetRangeSliderProps) {
  return (
    <Slider
      value={value}
      onValueChange={(next) => onValueChange(next)}
      min={BUDGET_RANGE.min}
      max={BUDGET_RANGE.max}
      step={BUDGET_RANGE.step}
      minStepsBetweenThumbs={1}
      thumbLabels={[copy.thumbs.min, copy.thumbs.max]}
      thumbValueText={kFormat}
    />
  );
}
