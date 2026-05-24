/**
 * Sandboxed worker process for challenge evaluation.
 * Spawned by challenge-runner.ts as a child process with no env vars.
 * Even if user code escapes the function scope, it cannot reach the parent
 * process or any database credentials.
 */

process.stdin.setEncoding('utf8');
let raw = '';
process.stdin.on('data', (chunk: string) => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const { code, testCases } = JSON.parse(raw) as {
      code: string;
      testCases: Array<{ input: string; expectedOutput: string; hidden: boolean; description?: string }>;
    };

    const testResults = testCases.map((tc) => {
      let passed = false;
      try {
        // Shadow the most common escape vectors. "use strict" makes `this`
        // undefined inside plain functions, closing the this.process path.
        // require is module-scoped in Node (not on global), so it is already
        // unreachable from new Function.
        const fn = new Function(
          'process', 'global', 'globalThis',
          `"use strict";\n${code}\nreturn String(solution(${tc.input}));`,
        );
        const result: string = fn(undefined, undefined, undefined);
        passed = result === String(tc.expectedOutput).trim();
      } catch {
        passed = false;
      }
      return { passed, hidden: tc.hidden, description: tc.description };
    });

    process.stdout.write(JSON.stringify({ testResults }));
  } catch {
    process.stdout.write(JSON.stringify({ testResults: [] }));
  }
  process.exit(0);
});
