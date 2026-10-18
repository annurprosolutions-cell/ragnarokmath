import { PRIMARY } from './primary';
import { SECONDARY } from './secondary';
import { GradeId, GRADES, Question, Rng, Topic, finalize } from './core';

export * from './core';

export const TOPICS: Topic[] = [...PRIMARY, ...SECONDARY];

const byGrade = new Map<GradeId, Topic[]>();
for (const t of TOPICS) {
  const list = byGrade.get(t.grade) ?? [];
  list.push(t);
  byGrade.set(t.grade, list);
}

export function topicsFor(grade: GradeId): Topic[] {
  return byGrade.get(grade) ?? [];
}

export function topicById(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}

export function makeQuestionFromTopic(topic: Topic, rng: Rng = new Rng()): Question {
  return finalize(topic, topic.gen(rng), rng);
}

/**
 * Pick a question for one of the given grades. Topics the player keeps getting
 * wrong (accuracy below 60%) are weighted up so practice lands where it's needed.
 */
export function makeQuestion(
  grades: GradeId[],
  rng: Rng = new Rng(),
  accuracy?: (topicId: string) => number | undefined,
): Question {
  const pool = grades.flatMap((g) => topicsFor(g));
  const weights = pool.map((t) => {
    const acc = accuracy?.(t.id);
    return acc === undefined ? 1 : acc < 0.6 ? 2 : 1;
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let pick = rng.next() * total;
  let topic = pool[0];
  for (let i = 0; i < pool.length; i++) {
    pick -= weights[i];
    if (pick <= 0) {
      topic = pool[i];
      break;
    }
  }
  return makeQuestionFromTopic(topic, rng);
}

export function gradesBetween(from: GradeId, to: GradeId): GradeId[] {
  return GRADES.slice(GRADES.indexOf(from), GRADES.indexOf(to) + 1);
}
