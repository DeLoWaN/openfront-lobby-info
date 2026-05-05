/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RangeSlider } from '@/modules/lobby-discovery/RangeSlider';

function setupDOM(): void {
  document.body.innerHTML = `
    <div id="root">
      <div class="ld-range">
        <div class="track"><div class="track-fill" id="fill"></div></div>
        <input type="range" id="min-pos" min="0" max="1000" value="0" class="capacity-slider capacity-slider-min">
        <input type="range" id="max-pos" min="0" max="1000" value="1000" class="capacity-slider capacity-slider-max">
      </div>
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
      <div id="ticks"></div>
    </div>
  `;
}

describe('RangeSlider — linear fallback (no stops)', () => {
  beforeEach(setupDOM);

  it('initialises number inputs from config bounds when defaults are out of range', () => {
    const onChange = vi.fn();
    new RangeSlider({
      rootId: 'root',
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
      rootId: 'root',
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
      rootId: 'root',
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
      rootId: 'root',
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

  it('drag snaps the value to the nearest stop', () => {
    const onChange = vi.fn();
    build(onChange);
    const minPos = document.getElementById('min-pos') as HTMLInputElement;
    // Position 0.42 maps to value ≈ 6.2; nearest stop is 6.
    minPos.value = '420';
    minPos.dispatchEvent(new Event('input'));
    expect(onChange).toHaveBeenCalledWith(6, 62);
    const minNum = document.getElementById('min-num') as HTMLInputElement;
    expect(minNum.value).toBe('6');
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
      rootId: 'root',
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
