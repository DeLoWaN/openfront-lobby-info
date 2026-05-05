import {
  clampToStops,
  nearestStop,
  positionToValue,
  valueToPosition,
} from '@/modules/lobby-discovery/RangeSliderHelpers';

export interface RangeSliderConfig {
  rootId: string;
  minSliderId: string;  // <input type="range"> 0..1000 for min position
  maxSliderId: string;  // <input type="range"> 0..1000 for max position
  minInputId: string;   // <input type="number"> for min value
  maxInputId: string;   // <input type="number"> for max value
  fillId: string;       // <div> whose --lo / --hi CSS vars draw the fill
  ticksContainerId?: string;
  bounds: { min: number; max: number };
  stops?: readonly number[];
  lockMaxToTwiceMin?: () => boolean;
  onChange: (min: number, max: number) => void;
}

const POSITION_RANGE = 1000;

export class RangeSlider {
  private readonly minSlider: HTMLInputElement;
  private readonly maxSlider: HTMLInputElement;
  private readonly minInput: HTMLInputElement;
  private readonly maxInput: HTMLInputElement;
  private readonly fill: HTMLElement | null;
  private readonly rangeRoot: HTMLElement | null;
  private readonly stops: readonly number[];
  private readonly cfg: RangeSliderConfig;
  private lastMin: number;
  private lastMax: number;

  constructor(cfg: RangeSliderConfig) {
    this.cfg = cfg;
    this.stops = cfg.stops ?? [cfg.bounds.min, cfg.bounds.max];
    this.minSlider = document.getElementById(cfg.minSliderId) as HTMLInputElement;
    this.maxSlider = document.getElementById(cfg.maxSliderId) as HTMLInputElement;
    this.minInput = document.getElementById(cfg.minInputId) as HTMLInputElement;
    this.maxInput = document.getElementById(cfg.maxInputId) as HTMLInputElement;
    this.fill = document.getElementById(cfg.fillId);
    this.rangeRoot = this.fill?.parentElement?.parentElement ?? null;

    if (!this.minSlider || !this.maxSlider || !this.minInput || !this.maxInput) {
      throw new Error(`RangeSlider: missing required element in ${cfg.rootId}`);
    }

    this.minSlider.min = '0';
    this.minSlider.max = String(POSITION_RANGE);
    this.maxSlider.min = '0';
    this.maxSlider.max = String(POSITION_RANGE);

    this.lastMin = this.readInputClamped(this.minInput, cfg.bounds.min);
    this.lastMax = this.readInputClamped(this.maxInput, cfg.bounds.max);
    if (this.lastMax < this.lastMin) this.lastMax = this.lastMin;

    this.minSlider.addEventListener('input', this.onMinSliderInput);
    this.maxSlider.addEventListener('input', this.onMaxSliderInput);
    this.minInput.addEventListener('change', this.onMinInputChange);
    this.maxInput.addEventListener('change', this.onMaxInputChange);

    this.applyValues(this.lastMin, this.lastMax, { fireOnChange: false });
  }

  /** Public setter — used when min is auto-bumped from outside (e.g. team-count chips). */
  setMin(value: number): void {
    this.applyValues(value, this.lastMax, { fireOnChange: true });
  }

  /** Public setter — used by reset / load. */
  setRange(min: number, max: number): void {
    this.applyValues(min, max, { fireOnChange: false });
  }

  private readInputClamped(el: HTMLInputElement, fallback: number): number {
    const parsed = parseInt(el.value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return clampToStops(parsed, [this.cfg.bounds.min, this.cfg.bounds.max]);
  }

  private onMinSliderInput = (): void => {
    const position = parseInt(this.minSlider.value, 10) / POSITION_RANGE;
    let value = positionToValue(position, this.stops);
    if (this.cfg.stops) value = nearestStop(value, this.stops);
    this.applyValues(value, this.lastMax, { fireOnChange: true });
  };

  private onMaxSliderInput = (): void => {
    const position = parseInt(this.maxSlider.value, 10) / POSITION_RANGE;
    let value = positionToValue(position, this.stops);
    if (this.cfg.stops) value = nearestStop(value, this.stops);
    this.applyValues(this.lastMin, value, { fireOnChange: true });
  };

  private onMinInputChange = (): void => {
    const parsed = parseInt(this.minInput.value, 10);
    if (!Number.isFinite(parsed)) {
      this.applyValues(this.lastMin, this.lastMax, { fireOnChange: false });
      return;
    }
    const clamped = clampToStops(parsed, [this.cfg.bounds.min, this.cfg.bounds.max]);
    this.applyValues(clamped, this.lastMax, { fireOnChange: true });
  };

  private onMaxInputChange = (): void => {
    const parsed = parseInt(this.maxInput.value, 10);
    if (!Number.isFinite(parsed)) {
      this.applyValues(this.lastMin, this.lastMax, { fireOnChange: false });
      return;
    }
    const clamped = clampToStops(parsed, [this.cfg.bounds.min, this.cfg.bounds.max]);
    this.applyValues(this.lastMin, clamped, { fireOnChange: true });
  };

  private applyValues(
    min: number,
    max: number,
    opts: { fireOnChange: boolean }
  ): void {
    let nextMin = min;
    let nextMax = max;

    // Lock-max-to-2× takes precedence when active.
    if (this.cfg.lockMaxToTwiceMin?.()) {
      nextMax = clampToStops(nextMin * 2, [this.cfg.bounds.min, this.cfg.bounds.max]);
    }

    if (nextMin > nextMax) {
      // Whichever was just changed wins; bump the other to match.
      // Heuristic: if min increased above max, bump max; otherwise bump min.
      if (nextMin > this.lastMin) nextMax = nextMin;
      else nextMin = nextMax;
    }

    this.lastMin = nextMin;
    this.lastMax = nextMax;

    this.minInput.value = String(nextMin);
    this.maxInput.value = String(nextMax);
    this.minSlider.value = String(Math.round(valueToPosition(nextMin, this.stops) * POSITION_RANGE));
    this.maxSlider.value = String(Math.round(valueToPosition(nextMax, this.stops) * POSITION_RANGE));

    if (this.rangeRoot) {
      const lo = valueToPosition(nextMin, this.stops) * 100;
      const hi = valueToPosition(nextMax, this.stops) * 100;
      this.rangeRoot.style.setProperty('--lo', `${lo}%`);
      this.rangeRoot.style.setProperty('--hi', `${hi}%`);
    }

    if (opts.fireOnChange) this.cfg.onChange(nextMin, nextMax);
  }
}
