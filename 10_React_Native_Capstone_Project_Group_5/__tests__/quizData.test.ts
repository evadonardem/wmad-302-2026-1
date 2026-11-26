import { PERSONALITIES, QUESTIONS, scoreAnswers } from '@/components/play-earn/quizData';

describe('quizData', () => {
  it('defines four personalities with required fields and character images', () => {
    const keys = ['budget', 'fashion', 'tech', 'aesthetic'] as const;
    keys.forEach((key) => {
      const p = PERSONALITIES[key];
      expect(p.key).toBe(key);
      expect(p.title).toBeTruthy();
      expect(p.tagline).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.icon).toBeTruthy();
      expect(p.accent).toMatch(/^#/);
      expect(p.character).toBeDefined();
      expect(p.categories.length).toBeGreaterThan(0);
      expect(p.tags.length).toBeGreaterThan(0);
    });
  });

  it('has five questions with four options each', () => {
    expect(QUESTIONS).toHaveLength(5);
    QUESTIONS.forEach((q) => {
      expect(q.prompt).toBeTruthy();
      expect(q.options).toHaveLength(4);
      const optionKeys = q.options.map((o) => o.key);
      expect(optionKeys).toEqual(['A', 'B', 'C', 'D']);
    });
  });

  it('scoreAnswers returns the most-picked personality', () => {
    expect(scoreAnswers(['budget', 'budget', 'fashion', 'tech', 'budget'])).toBe('budget');
    expect(scoreAnswers(['tech', 'fashion', 'tech', 'aesthetic', 'tech'])).toBe('tech');
  });

  it('scoreAnswers uses stable priority on ties', () => {
    // budget comes before fashion in ORDER when tied
    expect(scoreAnswers(['budget', 'fashion', 'budget', 'fashion', 'tech'])).toBe('budget');
  });
});
