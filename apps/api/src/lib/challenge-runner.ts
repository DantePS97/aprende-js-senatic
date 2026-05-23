import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

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

type TestCase = { input: string; expectedOutput: string; hidden: boolean; description?: string };

const TIMEOUT_MS = 5000;

function resolveWorker(): { cmd: string; args: string[] } {
  const jsWorker = path.join(__dirname, 'challenge-runner-worker.js');
  if (fs.existsSync(jsWorker)) {
    return { cmd: process.execPath, args: [jsWorker] };
  }
  // Development / test: TypeScript source not compiled yet.
  // Resolve the tsx CLI by absolute path so we don't depend on PATH.
  const tsWorker = path.join(__dirname, 'challenge-runner-worker.ts');
  try {
    const tsxCli = require.resolve('tsx/cli');
    return { cmd: process.execPath, args: [tsxCli, tsWorker] };
  } catch {
    return { cmd: 'tsx', args: [tsWorker] };
  }
}

function failAll(testCases: TestCase[]): RunResult {
  return {
    testResults: testCases.map((tc) => ({ passed: false, hidden: tc.hidden, description: tc.description })),
    testsPassedCount: 0,
    totalTests: testCases.length,
    passed: false,
  };
}

export function runChallengeTests(
  code: string,
  testCases: TestCase[],
): Promise<RunResult> {
  return new Promise((resolve) => {
    const { cmd, args } = resolveWorker();

    const child = spawn(cmd, args, {
      // Pass no credentials — only PATH so the OS can find tsx/node in dev
      env: { PATH: process.env.PATH ?? '' },
      stdio: ['pipe', 'pipe', 'ignore'],
    });

    let stdout = '';
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve(failAll(testCases));
    }, TIMEOUT_MS);

    child.on('close', () => {
      clearTimeout(timer);
      try {
        const { testResults } = JSON.parse(stdout) as { testResults: TestResult[] };
        const testsPassedCount = testResults.filter((r) => r.passed).length;
        resolve({
          testResults,
          testsPassedCount,
          totalTests: testCases.length,
          passed: testsPassedCount === testCases.length,
        });
      } catch {
        resolve(failAll(testCases));
      }
    });

    child.stdin.write(JSON.stringify({ code, testCases }));
    child.stdin.end();
  });
}
