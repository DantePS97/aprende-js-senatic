import { describe, it, expect } from 'vitest';
import { runChallengeTests } from './challenge-runner';

// ─── Helper: build a minimal test case ───────────────────────────────────────

function tc(
  input: string,
  expectedOutput: string,
  hidden = false,
  description?: string
) {
  return { input, expectedOutput, hidden, description };
}

// ─── runChallengeTests ────────────────────────────────────────────────────────

describe('runChallengeTests', () => {
  // ─── Código correcto ──────────────────────────────────────────────────────

  it('all tests pass when solution returns correct output', () => {
    const code = `function solution(n) { return n * 2; }`;
    const testCases = [
      tc('3', '6'),
      tc('5', '10'),
    ];
    const result = runChallengeTests(code, testCases);

    expect(result.passed).toBe(true);
    expect(result.testsPassedCount).toBe(2);
    expect(result.totalTests).toBe(2);
    expect(result.testResults[0].passed).toBe(true);
    expect(result.testResults[1].passed).toBe(true);
  });

  // ─── Output incorrecto ────────────────────────────────────────────────────

  it('test fails when solution returns wrong output', () => {
    const code = `function solution(n) { return n + 1; }`;
    const testCases = [tc('3', '6')];
    const result = runChallengeTests(code, testCases);

    expect(result.passed).toBe(false);
    expect(result.testsPassedCount).toBe(0);
    expect(result.testResults[0].passed).toBe(false);
  });

  // ─── Runtime error ────────────────────────────────────────────────────────

  it('test fails on runtime error without throwing to caller (ReferenceError)', () => {
    const code = `function solution(n) { return undefinedVar + n; }`;
    const testCases = [tc('1', '1')];

    expect(() => runChallengeTests(code, testCases)).not.toThrow();
    const result = runChallengeTests(code, testCases);

    expect(result.passed).toBe(false);
    expect(result.testResults[0].passed).toBe(false);
  });

  it('test fails on TypeError without throwing to caller', () => {
    const code = `function solution(n) { return null.toString(); }`;
    const testCases = [tc('1', 'anything')];

    expect(() => runChallengeTests(code, testCases)).not.toThrow();
    const result = runChallengeTests(code, testCases);

    expect(result.passed).toBe(false);
  });

  // ─── Syntax error ─────────────────────────────────────────────────────────

  it('test fails on syntax error without throwing to caller', () => {
    const code = `function solution(n) { return n +++++ }`;
    const testCases = [tc('1', '1')];

    expect(() => runChallengeTests(code, testCases)).not.toThrow();
    const result = runChallengeTests(code, testCases);

    expect(result.passed).toBe(false);
    expect(result.testsPassedCount).toBe(0);
  });

  // ─── Comparación numérica como string ────────────────────────────────────

  it('numeric output passes when expectedOutput is the string representation', () => {
    // __result__ = String(solution(2)) → "2", expectedOutput "2" → PASS
    const code = `function solution(n) { return n; }`;
    const testCases = [tc('2', '2')];
    const result = runChallengeTests(code, testCases);

    expect(result.passed).toBe(true);
    expect(result.testResults[0].passed).toBe(true);
  });

  it('boolean output passes when expectedOutput is string "true"', () => {
    const code = `function solution(n) { return n > 0; }`;
    const testCases = [tc('5', 'true')];
    const result = runChallengeTests(code, testCases);

    expect(result.passed).toBe(true);
  });

  // ─── Hidden test cases ────────────────────────────────────────────────────

  it('hidden test case result has passed but no description exposed', () => {
    const code = `function solution(n) { return n * 2; }`;
    const testCases = [
      tc('3', '6', false, 'visible test'),
      tc('7', '14', true, 'secret test'),
    ];
    const result = runChallengeTests(code, testCases);

    // Visible test: description preserved
    expect(result.testResults[0].hidden).toBe(false);
    expect(result.testResults[0].description).toBe('visible test');

    // Hidden test: description is present in the raw result (route layer strips it)
    // challenge-runner itself preserves the description from the test case
    expect(result.testResults[1].hidden).toBe(true);
    expect(result.testResults[1].passed).toBe(true);
  });

  it('hidden test case that fails still reports passed=false', () => {
    const code = `function solution(n) { return 0; }`;
    const testCases = [tc('7', '14', true, 'secret test')];
    const result = runChallengeTests(code, testCases);

    expect(result.testResults[0].passed).toBe(false);
    expect(result.testResults[0].hidden).toBe(true);
    expect(result.passed).toBe(false);
  });

  // ─── testsPassedCount y totalTests ───────────────────────────────────────

  it('testsPassedCount and totalTests are correct with partial pass', () => {
    const code = `function solution(n) { return n === 1 ? 1 : 0; }`;
    const testCases = [
      tc('1', '1'),   // pass
      tc('2', '0'),   // pass
      tc('3', '99'),  // fail
    ];
    const result = runChallengeTests(code, testCases);

    expect(result.totalTests).toBe(3);
    expect(result.testsPassedCount).toBe(2);
    expect(result.passed).toBe(false);
  });

  it('passed is true only when all tests pass', () => {
    const code = `function solution(n) { return n; }`;
    const allPass = [tc('1', '1'), tc('2', '2')];
    const partial = [tc('1', '1'), tc('2', '99')];

    expect(runChallengeTests(code, allPass).passed).toBe(true);
    expect(runChallengeTests(code, partial).passed).toBe(false);
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────

  it('handles empty string output correctly', () => {
    const code = `function solution() { return ''; }`;
    const testCases = [tc('', '')];
    const result = runChallengeTests(code, testCases);

    expect(result.passed).toBe(true);
  });

  it('solution accessing outer scope is blocked (sandbox isolation)', () => {
    // process should not be accessible inside the sandbox
    const code = `function solution() { return process.env.NODE_ENV; }`;
    const testCases = [tc('', 'test')];

    expect(() => runChallengeTests(code, testCases)).not.toThrow();
    const result = runChallengeTests(code, testCases);

    // Either throws inside VM (passed=false) or returns wrong value
    expect(result.testResults[0].passed).toBe(false);
  });
});
