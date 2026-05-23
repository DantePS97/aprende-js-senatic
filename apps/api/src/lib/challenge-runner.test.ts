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

  it('all tests pass when solution returns correct output', async () => {
    const code = `function solution(n) { return n * 2; }`;
    const testCases = [
      tc('3', '6'),
      tc('5', '10'),
    ];
    const result = await runChallengeTests(code, testCases);

    expect(result.passed).toBe(true);
    expect(result.testsPassedCount).toBe(2);
    expect(result.totalTests).toBe(2);
    expect(result.testResults[0].passed).toBe(true);
    expect(result.testResults[1].passed).toBe(true);
  });

  // ─── Output incorrecto ────────────────────────────────────────────────────

  it('test fails when solution returns wrong output', async () => {
    const code = `function solution(n) { return n + 1; }`;
    const testCases = [tc('3', '6')];
    const result = await runChallengeTests(code, testCases);

    expect(result.passed).toBe(false);
    expect(result.testsPassedCount).toBe(0);
    expect(result.testResults[0].passed).toBe(false);
  });

  // ─── Runtime error ────────────────────────────────────────────────────────

  it('test fails on runtime error without throwing to caller (ReferenceError)', async () => {
    const code = `function solution(n) { return undefinedVar + n; }`;
    const testCases = [tc('1', '1')];

    const result = await runChallengeTests(code, testCases);

    expect(result.passed).toBe(false);
    expect(result.testResults[0].passed).toBe(false);
  });

  it('test fails on TypeError without throwing to caller', async () => {
    const code = `function solution(n) { return null.toString(); }`;
    const testCases = [tc('1', 'anything')];

    const result = await runChallengeTests(code, testCases);

    expect(result.passed).toBe(false);
  });

  // ─── Syntax error ─────────────────────────────────────────────────────────

  it('test fails on syntax error without throwing to caller', async () => {
    const code = `function solution(n) { return n +++++ }`;
    const testCases = [tc('1', '1')];

    const result = await runChallengeTests(code, testCases);

    expect(result.passed).toBe(false);
    expect(result.testsPassedCount).toBe(0);
  });

  // ─── Comparación numérica como string ────────────────────────────────────

  it('numeric output passes when expectedOutput is the string representation', async () => {
    const code = `function solution(n) { return n; }`;
    const testCases = [tc('2', '2')];
    const result = await runChallengeTests(code, testCases);

    expect(result.passed).toBe(true);
    expect(result.testResults[0].passed).toBe(true);
  });

  it('boolean output passes when expectedOutput is string "true"', async () => {
    const code = `function solution(n) { return n > 0; }`;
    const testCases = [tc('5', 'true')];
    const result = await runChallengeTests(code, testCases);

    expect(result.passed).toBe(true);
  });

  // ─── Hidden test cases ────────────────────────────────────────────────────

  it('hidden test case result has passed but no description exposed', async () => {
    const code = `function solution(n) { return n * 2; }`;
    const testCases = [
      tc('3', '6', false, 'visible test'),
      tc('7', '14', true, 'secret test'),
    ];
    const result = await runChallengeTests(code, testCases);

    // Visible test: description preserved
    expect(result.testResults[0].hidden).toBe(false);
    expect(result.testResults[0].description).toBe('visible test');

    // Hidden test: description is present in the raw result (route layer strips it)
    // challenge-runner itself preserves the description from the test case
    expect(result.testResults[1].hidden).toBe(true);
    expect(result.testResults[1].passed).toBe(true);
  });

  it('hidden test case that fails still reports passed=false', async () => {
    const code = `function solution(n) { return 0; }`;
    const testCases = [tc('7', '14', true, 'secret test')];
    const result = await runChallengeTests(code, testCases);

    expect(result.testResults[0].passed).toBe(false);
    expect(result.testResults[0].hidden).toBe(true);
    expect(result.passed).toBe(false);
  });

  // ─── testsPassedCount y totalTests ───────────────────────────────────────

  it('testsPassedCount and totalTests are correct with partial pass', async () => {
    const code = `function solution(n) { return n === 1 ? 1 : 0; }`;
    const testCases = [
      tc('1', '1'),   // pass
      tc('2', '0'),   // pass
      tc('3', '99'),  // fail
    ];
    const result = await runChallengeTests(code, testCases);

    expect(result.totalTests).toBe(3);
    expect(result.testsPassedCount).toBe(2);
    expect(result.passed).toBe(false);
  });

  it('passed is true only when all tests pass', async () => {
    const code = `function solution(n) { return n; }`;
    const allPass = [tc('1', '1'), tc('2', '2')];
    const partial = [tc('1', '1'), tc('2', '99')];

    expect((await runChallengeTests(code, allPass)).passed).toBe(true);
    expect((await runChallengeTests(code, partial)).passed).toBe(false);
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────

  it('handles empty string output correctly', async () => {
    const code = `function solution() { return ''; }`;
    const testCases = [tc('', '')];
    const result = await runChallengeTests(code, testCases);

    expect(result.passed).toBe(true);
  });

  it('solution cannot access process or env vars (sandbox isolation)', async () => {
    // process is shadowed to undefined inside the worker function
    const code = `function solution() { return process.env.NODE_ENV; }`;
    const testCases = [tc('', 'test')];

    const result = await runChallengeTests(code, testCases);

    // TypeError inside worker → passed=false
    expect(result.testResults[0].passed).toBe(false);
  });

  // ─── Infinite loop / timeout ──────────────────────────────────────────────

  it('infinite loop times out and all tests fail', async () => {
    const code = `function solution(n) { while(true) {} return n; }`;
    const testCases = [tc('1', '1')];

    // Use a custom timeout on the test itself; the runner has TIMEOUT_MS = 5s
    const result = await runChallengeTests(code, testCases);

    expect(result.passed).toBe(false);
    expect(result.testsPassedCount).toBe(0);
  }, 10_000);
});
