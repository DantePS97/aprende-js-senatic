import vm from 'vm';

export interface TestResult {
  passed: boolean;
  description?: string;
  hidden: boolean;
}

export interface RunResult {
  testResults: TestResult[];
  testsPassedCount: number;
  totalTests: number;
  passed: boolean;
}

const TIMEOUT_MS = 3000;

export function runChallengeTests(
  code: string,
  testCases: Array<{ input: string; expectedOutput: string; hidden: boolean; description?: string }>
): RunResult {
  const testResults: TestResult[] = [];

  for (const tc of testCases) {
    let testPassed = false;
    try {
      const script = new vm.Script(`
        ${code}
        __result__ = String(solution(${tc.input}));
      `);
      const ctx = vm.createContext({ __result__: undefined, console: { log: () => {} } });
      script.runInContext(ctx, { timeout: TIMEOUT_MS });
      testPassed = (ctx.__result__ as string) === String(tc.expectedOutput).trim();
    } catch {
      testPassed = false;
    }
    testResults.push({ passed: testPassed, hidden: tc.hidden, description: tc.description });
  }

  const testsPassedCount = testResults.filter((r) => r.passed).length;
  return {
    testResults,
    testsPassedCount,
    totalTests: testCases.length,
    passed: testsPassedCount === testCases.length,
  };
}
