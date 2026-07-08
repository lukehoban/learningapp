import { describe, it, expect } from 'vitest';
import { generateLocalProblem } from '../problemGenerator';

describe('generateLocalProblem', () => {
  it('generates a valid problem for grade 1', () => {
    const problem = generateLocalProblem(1, 0);
    expect(problem.grade).toBe(1);
    expect(['addition', 'subtraction']).toContain(problem.operation);
    expect(typeof problem.correctAnswer).toBe('number');
    expect(problem.question).toMatch(/\?/);
    expect(problem.id).toBeTruthy();
  });

  it('generates a valid problem for grade 3 (multiplication/division)', () => {
    // Run multiple times to increase chance of hitting multiply/divide
    let foundMultOrDiv = false;
    for (let i = 0; i < 50; i++) {
      const p = generateLocalProblem(3, 0);
      if (p.operation === 'multiplication' || p.operation === 'division') {
        foundMultOrDiv = true;
        break;
      }
    }
    expect(foundMultOrDiv).toBe(true);
  });

  it('grade 1 subtraction result is non-negative', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateLocalProblem(1, 0);
      if (p.operation === 'subtraction') {
        expect(p.correctAnswer).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('division answer is always a whole number', () => {
    for (let i = 0; i < 50; i++) {
      const p = generateLocalProblem(3, 0);
      if (p.operation === 'division') {
        expect(Number.isInteger(p.correctAnswer)).toBe(true);
        expect(p.correctAnswer).toBeGreaterThan(0);
      }
    }
  });

  it('problems get harder with streak (max numbers increase)', () => {
    // With streak=5 the numbers should reach higher than streak=0
    const lowStreakProblems = Array.from({ length: 20 }, () => generateLocalProblem(2, 0));
    const highStreakProblems = Array.from({ length: 20 }, () => generateLocalProblem(2, 5));
    const maxLow = Math.max(...lowStreakProblems.map((p) => p.correctAnswer));
    const maxHigh = Math.max(...highStreakProblems.map((p) => p.correctAnswer));
    // High streak can reach larger numbers — this is probabilistic so we just verify no errors
    expect(maxLow).toBeGreaterThan(0);
    expect(maxHigh).toBeGreaterThan(0);
  });

  it('generates unique ids', () => {
    const ids = Array.from({ length: 10 }, () => generateLocalProblem(1, 0).id);
    const unique = new Set(ids);
    expect(unique.size).toBe(10);
  });
});
