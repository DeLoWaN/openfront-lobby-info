/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RangeSlider } from '@/modules/lobby-discovery/RangeSlider';

/**
 * The fixture mirrors production markup: steppers live inside `.ld-slider-label`
 * (scoped by `containerId`) and range inputs live inside `.ld-range` (scoped by
 * `rangeRootId`). The outer `.ld-slider-row` is the container.
 */
function setupDOM(): void {
  document.body.innerHTML = `
    <div id="container" class="ld-slider-row">
      <div class="ld-slider-label">
        <div class="ld-stepper" data-role="min">
          <button type="button" class="ld-step-btn" data-action="dec" data-target="min">−</button>
          <input type="number" id="min-num" value="1">
          <button type="button" class="ld-step-btn" data-action="inc" data-target="min">+</button>
        </div>
        <div class="ld-stepper" data-role="max">
          <button type="button" class="ld-step-btn" data-action="dec" data-target="max">−</button>
          <input type="number" id="max-num" value="125">
          <button type="button" class="ld-step-btn" data-action="inc" data-target="max">+</button>
        </div>
      </div>
      <div id="range-root" class="ld-range">
        <div class="track"><div class="track-fill" id="fill"></div></div>
        <input type="range" id="min-pos" min="0" max="1000" value="0" class="capacity-slider capacity-slider-min">
        <input type="range" id="max-pos" min="0" max="1000" value="1000" class="capacity-slider capacity-slider-max">
      </div>
      <div id="ticks"></div>
    </div>
  `;
}

describe('RangeSlider — linear fallback (no stops)', () => {
  beforeEach(setupDOM);

  it('initialises number inputs from config bounds when defaults are out of range', () => {
    const onChange = vi.fn();
    new RangeSlider({
      containerId: 'container',
      rangeRootId: 'range-root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      bounds: { min: 1, max: 125 },
      onChange,
    });
    const minNum = document.getElementById('min-num') as HTMLInputElement;
    const maxNum = document.getElementById('max-num') as HTMLInputElement;
    expect(minNum.value).toBe('1');
    expect(maxNum.value).toBe('125');
  });

  it('drag on min position fires onChange with new (min, max)', () => {
    const onChange = vi.fn();
    new RangeSlider({
      containerId: 'container',
      rangeRootId: 'range-root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      bounds: { min: 1, max: 125 },
      onChange,
    });
    const minPos = document.getElementById('min-pos') as HTMLInputElement;
    minPos.value = '500';  // halfway → value ≈ 63
    minPos.dispatchEvent(new Event('input'));
    expect(onChange).toHaveBeenCalled();
    const [min, max] = onChange.mock.calls.at(-1)!;
    expect(min).toBe(63);  // round(1 + 0.5 * 124) = 63
    expect(max).toBe(125);
  });

  it('drag past max bumps min back so min <= max', () => {
    const onChange = vi.fn();
    new RangeSlider({
      containerId: 'container',
      rangeRootId: 'range-root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      bounds: { min: 1, max: 125 },
      onChange,
    });
    const minPos = document.getElementById('min-pos') as HTMLInputElement;
    const maxPos = document.getElementById('max-pos') as HTMLInputElement;
    maxPos.value = '500';
    maxPos.dispatchEvent(new Event('input'));
    minPos.value = '900';  // would map to ~112, > 63
    minPos.dispatchEvent(new Event('input'));
    const [min, max] = onChange.mock.calls.at(-1)!;
    expect(min).toBeLessThanOrEqual(max);
  });
});

describe('RangeSlider — with stops (snap-on-drag)', () => {
  const stops = [2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62];

  beforeEach(() => {
    setupDOM();
    // Reset starting values to per-team defaults.
    (document.getElementById('min-num') as HTMLInputElement).value = '2';
    (document.getElementById('max-num') as HTMLInputElement).value = '62';
  });

  function build(onChange = vi.fn(), lockFn?: () => boolean) {
    return new RangeSlider({
      containerId: 'container',
      rangeRootId: 'range-root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      bounds: { min: 2, max: 62 },
      stops,
      lockMaxToTwiceMin: lockFn,
      onChange,
    });
  }

  it('drag produces every integer along the log-mapped scale (no snapping)', () => {
    const onChange = vi.fn();
    build(onChange);
    const minPos = document.getElementById('min-pos') as HTMLInputElement;
    // Position 0.45 sits halfway in the 6→8 segment (positions 0.4–0.5),
    // so the integer value is 7 — not snapped to a stop.
    minPos.value = '450';
    minPos.dispatchEvent(new Event('input'));
    expect(onChange).toHaveBeenCalledWith(7, 62);
    const minNum = document.getElementById('min-num') as HTMLInputElement;
    expect(minNum.value).toBe('7');
  });

  it('typing a non-stop value into the number input keeps that exact value', () => {
    const onChange = vi.fn();
    build(onChange);
    const minNum = document.getElementById('min-num') as HTMLInputElement;
    minNum.value = '7';
    minNum.dispatchEvent(new Event('change'));
    expect(onChange).toHaveBeenCalledWith(7, 62);
    expect(minNum.value).toBe('7');
  });

  it('typed value > bounds.max clamps to bounds.max', () => {
    const onChange = vi.fn();
    build(onChange);
    const maxNum = document.getElementById('max-num') as HTMLInputElement;
    maxNum.value = '200';
    maxNum.dispatchEvent(new Event('change'));
    expect(onChange).toHaveBeenCalledWith(2, 62);
    expect(maxNum.value).toBe('62');
  });

  it('typed empty string reverts to last value', () => {
    const onChange = vi.fn();
    build(onChange);
    const minNum = document.getElementById('min-num') as HTMLInputElement;
    minNum.value = '';
    minNum.dispatchEvent(new Event('change'));
    expect(minNum.value).toBe('2');  // unchanged from default
  });

  it('dragging min up past max bumps max to match min', () => {
    const onChange = vi.fn();
    build(onChange);
    // Set max to 5 first, then drag min past it.
    const maxNum = document.getElementById('max-num') as HTMLInputElement;
    maxNum.value = '5';
    maxNum.dispatchEvent(new Event('change'));
    // Drag min slider to position that maps to stop 8 (> 5).
    const minPos = document.getElementById('min-pos') as HTMLInputElement;
    minPos.value = '500';  // maps to stop 8
    minPos.dispatchEvent(new Event('input'));
    const [min, max] = onChange.mock.calls.at(-1)!;
    expect(min).toBeLessThanOrEqual(max);
    expect(min).toBe(max);  // max was bumped up to meet min
  });

  it('dragging max down past min bumps min to match max', () => {
    const onChange = vi.fn();
    build(onChange);
    // Set min to 20 first, then drag max below it.
    const minNum = document.getElementById('min-num') as HTMLInputElement;
    minNum.value = '20';
    minNum.dispatchEvent(new Event('change'));
    // Drag max slider to position that maps to stop 6 (< 20).
    const maxPos = document.getElementById('max-pos') as HTMLInputElement;
    maxPos.value = '400';  // maps to stop 6
    maxPos.dispatchEvent(new Event('input'));
    const [min, max] = onChange.mock.calls.at(-1)!;
    expect(min).toBeLessThanOrEqual(max);
    expect(min).toBe(max);  // min was bumped down to meet max
  });

  it('setMin lowering min below current max sets min correctly', () => {
    const onChange = vi.fn();
    const slider = build(onChange);
    // Force lastMin/lastMax to a state where min == max via setRange.
    slider.setRange(8, 8);
    // Now lower min via setMin — should respect the new value, not snap to lastMin.
    slider.setMin(3);
    const minNum = document.getElementById('min-num') as HTMLInputElement;
    expect(minNum.value).toBe('3');
  });
});

describe('RangeSlider — stepper buttons', () => {
  const stops = [2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62];

  beforeEach(() => {
    setupDOM();
    (document.getElementById('min-num') as HTMLInputElement).value = '5';
    (document.getElementById('max-num') as HTMLInputElement).value = '20';
  });

  function build(onChange = vi.fn()) {
    return new RangeSlider({
      containerId: 'container',
      rangeRootId: 'range-root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      bounds: { min: 2, max: 62 },
      stops,
      onChange,
    });
  }

  function clickStep(target: 'min' | 'max', action: 'inc' | 'dec'): void {
    const btn = document.querySelector(
      `.ld-step-btn[data-action="${action}"][data-target="${target}"]`
    ) as HTMLButtonElement;
    btn.click();
  }

  it('+ button increments the value by 1', () => {
    const onChange = vi.fn();
    build(onChange);
    clickStep('min', 'inc');
    expect(onChange).toHaveBeenCalledWith(6, 20);
    expect((document.getElementById('min-num') as HTMLInputElement).value).toBe('6');
  });

  it('− button decrements the value by 1', () => {
    const onChange = vi.fn();
    build(onChange);
    clickStep('max', 'dec');
    expect(onChange).toHaveBeenCalledWith(5, 19);
  });

  it('+ button clamps at bounds.max', () => {
    (document.getElementById('max-num') as HTMLInputElement).value = '62';
    const onChange = vi.fn();
    build(onChange);
    clickStep('max', 'inc');
    expect((document.getElementById('max-num') as HTMLInputElement).value).toBe('62');
  });

  it('− button clamps at bounds.min', () => {
    (document.getElementById('min-num') as HTMLInputElement).value = '2';
    const onChange = vi.fn();
    build(onChange);
    clickStep('min', 'dec');
    expect((document.getElementById('min-num') as HTMLInputElement).value).toBe('2');
  });
});

describe('RangeSlider — lock-max-to-2×', () => {
  const stops = [2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62];
  let locked = false;

  beforeEach(() => {
    setupDOM();
    locked = false;
    (document.getElementById('min-num') as HTMLInputElement).value = '4';
    (document.getElementById('max-num') as HTMLInputElement).value = '62';
  });

  function build() {
    const onChange = vi.fn();
    const slider = new RangeSlider({
      containerId: 'container',
      rangeRootId: 'range-root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      bounds: { min: 2, max: 62 },
      stops,
      lockMaxToTwiceMin: () => locked,
      onChange,
    });
    return { slider, onChange };
  }

  it('with lock active, changing min updates max to 2× min', () => {
    locked = true;
    const { onChange } = build();
    const minNum = document.getElementById('min-num') as HTMLInputElement;
    minNum.value = '5';
    minNum.dispatchEvent(new Event('change'));
    const [min, max] = onChange.mock.calls.at(-1)!;
    expect(min).toBe(5);
    expect(max).toBe(10);
  });

  it('with lock active and min × 2 exceeding bounds.max, max clamps to bounds.max', () => {
    locked = true;
    const { onChange } = build();
    const minNum = document.getElementById('min-num') as HTMLInputElement;
    minNum.value = '40';
    minNum.dispatchEvent(new Event('change'));
    const [, max] = onChange.mock.calls.at(-1)!;
    expect(max).toBe(62);
  });

  it('toggling lock applies disabled + .is-max-locked on max controls', () => {
    const { slider } = build();
    locked = true;
    slider.applyLockState();
    const maxSlider = document.getElementById('max-pos') as HTMLInputElement;
    const maxNum = document.getElementById('max-num') as HTMLInputElement;
    expect(maxSlider.disabled).toBe(true);
    expect(maxNum.disabled).toBe(true);
    expect(maxSlider.classList.contains('is-max-locked')).toBe(true);
    const decBtn = document.querySelector(
      '.ld-step-btn[data-target="max"][data-action="dec"]'
    ) as HTMLButtonElement;
    const incBtn = document.querySelector(
      '.ld-step-btn[data-target="max"][data-action="inc"]'
    ) as HTMLButtonElement;
    expect(decBtn.disabled).toBe(true);
    expect(incBtn.disabled).toBe(true);
  });

  it('removing lock re-enables max controls', () => {
    const { slider } = build();
    locked = true;
    slider.applyLockState();
    locked = false;
    slider.applyLockState();
    const maxSlider = document.getElementById('max-pos') as HTMLInputElement;
    expect(maxSlider.disabled).toBe(false);
    expect(maxSlider.classList.contains('is-max-locked')).toBe(false);
  });
});

describe('RangeSlider — tick rendering', () => {
  const stops = [2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62];

  beforeEach(setupDOM);

  it('renders one tick + label per stop in the ticks container', () => {
    new RangeSlider({
      containerId: 'container',
      rangeRootId: 'range-root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      ticksContainerId: 'ticks',
      bounds: { min: 2, max: 62 },
      stops,
      onChange: () => {},
    });
    const ticks = document.querySelectorAll('#ticks .ld-tick');
    const labels = document.querySelectorAll('#ticks .ld-tick-label');
    expect(ticks.length).toBe(stops.length);
    expect(labels.length).toBe(stops.length);
    expect(labels[0]!.textContent).toBe('2');
    expect(labels[labels.length - 1]!.textContent).toBe('62');
  });

  it('positions each tick at valueToPosition(stop) * 100%', () => {
    new RangeSlider({
      containerId: 'container',
      rangeRootId: 'range-root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      ticksContainerId: 'ticks',
      bounds: { min: 2, max: 62 },
      stops,
      onChange: () => {},
    });
    const ticks = document.querySelectorAll<HTMLElement>('#ticks .ld-tick');
    expect(ticks[0]!.style.left).toBe('0%');
    expect(ticks[4]!.style.left).toBe('40%');  // value 6 → 0.4
    expect(ticks[ticks.length - 1]!.style.left).toBe('100%');
  });

  it('does not render ticks when ticksContainerId is omitted', () => {
    new RangeSlider({
      containerId: 'container',
      rangeRootId: 'range-root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      bounds: { min: 1, max: 125 },
      onChange: () => {},
    });
    expect(document.querySelectorAll('#ticks .ld-tick').length).toBe(0);
  });
});

describe('RangeSlider — CSS custom properties on rangeRoot', () => {
  it('sets --lo / --hi CSS vars on the range root after construction', () => {
    document.body.innerHTML = `
      <div id="container" class="ld-slider-row">
        <div class="ld-slider-label">
          <input type="number" id="min-num" value="2">
          <input type="number" id="max-num" value="62">
        </div>
        <div id="range-root" class="ld-range">
          <div class="track"><div class="track-fill" id="fill"></div></div>
          <input type="range" id="min-pos" min="0" max="1000" value="0" class="capacity-slider capacity-slider-min">
          <input type="range" id="max-pos" min="0" max="1000" value="1000" class="capacity-slider capacity-slider-max">
        </div>
      </div>
    `;
    new RangeSlider({
      containerId: 'container',
      rangeRootId: 'range-root',
      minSliderId: 'min-pos',
      maxSliderId: 'max-pos',
      minInputId: 'min-num',
      maxInputId: 'max-num',
      fillId: 'fill',
      bounds: { min: 2, max: 62 },
      stops: [2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 62],
      onChange: () => {},
    });
    const root = document.getElementById('range-root') as HTMLElement;
    expect(root.style.getPropertyValue('--lo')).toBe('0%');
    expect(root.style.getPropertyValue('--hi')).toBe('100%');
  });
});
