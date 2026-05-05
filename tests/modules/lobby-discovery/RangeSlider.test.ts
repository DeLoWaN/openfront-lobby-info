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
