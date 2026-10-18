import { describe, it, expect } from 'vitest';
import { TOPICS, GRADES, Rng, makeQuestionFromTopic, topicsFor } from '../src/math';

const strip = (h: string) => h.replace(/<[^>]+>/g, '');

describe('question generators', () => {
  it('every grade has topics', () => {
    for (const g of GRADES) expect(topicsFor(g).length, g).toBeGreaterThanOrEqual(5);
  });

  it('topic ids are unique', () => {
    const ids = TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const topic of TOPICS) {
    it(`${topic.id} produces valid questions`, () => {
      const rng = new Rng(1234);
      for (let i = 0; i < 400; i++) {
        const q = makeQuestionFromTopic(topic, rng);
        const ctx = `${topic.id} #${i}: ${strip(q.prompt)} | ${q.choices.map(strip).join(' / ')}`;
        expect(q.choices.length, ctx).toBe(4);
        expect(new Set(q.choices).size, ctx).toBe(q.choices.length);
        expect(q.answer, ctx).toBeGreaterThanOrEqual(0);
        for (const c of q.choices) {
          expect(c, ctx).not.toMatch(/NaN|undefined|Infinity|null/);
          expect(strip(c).trim().length, ctx).toBeGreaterThan(0);
          // No float noise like 0.30000000000000004 or 1.4142135
          expect(strip(c), ctx).not.toMatch(/\d\.\d{5,}/);
        }
        expect(q.prompt, ctx).not.toMatch(/NaN|undefined|Infinity/);
        expect(q.explain, ctx).not.toMatch(/NaN|undefined|Infinity/);
      }
    });
  }
});
