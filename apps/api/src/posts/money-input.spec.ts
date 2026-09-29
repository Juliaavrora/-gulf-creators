import { parseMajorToMinor } from '@gulf/shared';
import { describe, expect, it } from 'vitest';

describe('parseMajorToMinor', () => {
  it('converts to integer minor units without float errors', () => {
    expect(parseMajorToMinor('25')).toBe(2500);
    expect(parseMajorToMinor('25.5')).toBe(2550);
    expect(parseMajorToMinor('0.29')).toBe(29);
    expect(parseMajorToMinor('19.99')).toBe(1999);
  });
  it('accepts Arabic digits and separators', () => {
    expect(parseMajorToMinor('٢٥')).toBe(2500);
    expect(parseMajorToMinor('١٩٫٩٩')).toBe(1999);
    expect(parseMajorToMinor('12,5')).toBe(1250);
  });
  it('rejects garbage and more than two decimals', () => {
    expect(parseMajorToMinor('')).toBeNull();
    expect(parseMajorToMinor('abc')).toBeNull();
    expect(parseMajorToMinor('1.999')).toBeNull();
    expect(parseMajorToMinor('-5')).toBeNull();
  });
});
