import { sleep } from 'openai/core';
import { splitArrayByLength } from './array';
import { vietnameseSlugify } from './slugify';

describe('Helpers', () => {
  it('sleep functional', async () => {
    const start = new Date();
    await sleep(1000);
    const end = new Date();
    expect(end.getTime() - start.getTime()).toBeGreaterThanOrEqual(1000);
  });

  it('splitArrayByLength functional', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = splitArrayByLength(arr, 3);
    expect(result).toHaveLength(4);
    expect(result[0]).toHaveLength(3);
    expect(result[1]).toHaveLength(3);
    expect(result[2]).toHaveLength(3);
    expect(result[3]).toHaveLength(1);
  });

  it('slugify functional', () => {
    expect(vietnameseSlugify('Xin chào Việt Nam')).toBe('xin-chao-viet-nam');
  });
});
