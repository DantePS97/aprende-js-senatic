'use client';

import type {
  SandboxRequest,
  SandboxResponse,
  SandboxResult,
  TestResult,
  RunOptions,
} from '@senatic/shared';

export type { SandboxResult, TestResult, RunOptions } from '@senatic/shared';

export function runInSandbox(options: RunOptions, timeoutMs = 5000): Promise<SandboxResult> {
  if (typeof Worker === 'undefined') {
    return Promise.reject('runInSandbox solo está disponible en el navegador');
  }

  const clampedTimeout = Math.min(Math.max(timeoutMs, 100), 15000);

  return new Promise((resolve) => {
    const worker = new Worker(
      new URL('./sandbox.worker.ts', import.meta.url),
      { type: 'module' },
    );

    const timeoutId = setTimeout(() => {
      worker.terminate();
      resolve({
        status: 'timeout',
        output: [],
        error: 'Tiempo de ejecución agotado (posible bucle infinito)',
        testResults: options.tests.map((t) => ({ description: t.description, passed: false })),
      });
    }, clampedTimeout);

    worker.onmessage = (event: MessageEvent<SandboxResponse>) => {
      clearTimeout(timeoutId);
      worker.terminate();

      const { status, logs, error, testResults: workerResults, errorStack } = event.data;

      const output = logs.map((l) => l.text);

      const testResults: TestResult[] = workerResults.map((r) => ({
        description: r.description,
        passed: r.ok,
        error: r.error,
      }));

      resolve({ status, output, error, testResults, errorStack });
    };

    worker.onerror = (err) => {
      clearTimeout(timeoutId);
      worker.terminate();
      resolve({
        status: 'error',
        output: [],
        error: err.message ?? 'Error desconocido en el worker',
        testResults: options.tests.map((t) => ({ description: t.description, passed: false })),
      });
    };

    const request: SandboxRequest = { code: options.code, tests: options.tests };
    worker.postMessage(request);
  });
}
