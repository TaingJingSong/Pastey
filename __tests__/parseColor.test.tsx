import { parseColor } from '../src/utils/parseColor';
import { it, expect, jest, describe } from '@jest/globals';

describe('parseColor', () => {
  it('parses 3-digit hex', () => {
    expect(parseColor('#F50')).toEqual({
      hex: '#ff5500', alpha: 1, original: '#F50',
    });
  });

  it('parses 6-digit hex', () => {
    expect(parseColor('#FF5500')).toEqual({
      hex: '#FF5500', alpha: 1, original: '#FF5500',
    });
  });

  it('parses 8-digit hex with alpha', () => {
    const result = parseColor('#FF550080');
    expect(result?.hex).toBe('#FF5500');
    expect(result?.alpha).toBeCloseTo(0.5, 1);
  });

  it('parses rgb()', () => {
    expect(parseColor('rgb(255, 85, 0)')).toEqual({
      hex: '#ff5500', alpha: 1, original: 'rgb(255, 85, 0)',
    });
  });

  it('parses rgba()', () => {
    const result = parseColor('rgba(255, 85, 0, 0.5)');
    expect(result?.hex).toBe('#ff5500');
    expect(result?.alpha).toBe(0.5);
  });

  it('parses hsl()', () => {
    const result = parseColor('hsl(20, 100%, 50%)');
    expect(result?.hex).toBe('#ff5500');
  });

  it('handles surrounding whitespace', () => {
    expect(parseColor('  #FF5500  ')?.hex).toBe('#FF5500');
  });

  it('returns null for a CSS snippet', () => {
    expect(parseColor('color: #ff5500;')).toBeNull();
  });

  it('returns null for a plain word', () => {
    expect(parseColor('red')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseColor('')).toBeNull();
  });

  it('returns null for oversized input', () => {
    expect(parseColor('#'.repeat(100))).toBeNull();
  });
});