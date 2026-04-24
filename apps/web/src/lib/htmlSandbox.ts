'use client';

import type { RunOptions, SandboxResult, TestResult } from '@senatic/shared';

const DEFAULT_TIMEOUT_MS = 6000;

export function runHtmlSandbox(
  options: RunOptions,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<SandboxResult> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('runHtmlSandbox solo está disponible en el navegador'));
  }

  const clampedTimeout = Math.min(Math.max(timeoutMs, 500), 15000);

  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.cssText =
      'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';

    document.body.appendChild(iframe);

    let settled = false;

    const timeoutResult: SandboxResult = {
      status: 'timeout',
      output: [],
      error: 'Tiempo de espera agotado — el HTML puede estar malformado',
      testResults: options.tests.map((t) => ({
        description: t.description,
        passed: false,
      })),
    };

    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      iframe.remove();
      resolve(timeoutResult);
    }, clampedTimeout);

    iframe.onload = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);

      const testResults: TestResult[] = [];
      let evalError: string | null = null;

      try {
        const doc = iframe.contentDocument!;
        const win = iframe.contentWindow!;

        for (const test of options.tests) {
          try {
            // eslint-disable-next-line no-new-func
            const fn = new Function('doc', 'win', `return Boolean(${test.expression});`);
            const passed = fn(doc, win) as boolean;
            testResults.push({ description: test.description, passed });
          } catch (e: unknown) {
            testResults.push({
              description: test.description,
              passed: false,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        }
      } catch (e: unknown) {
        evalError = e instanceof Error ? e.message : String(e);
        for (const test of options.tests) {
          testResults.push({ description: test.description, passed: false });
        }
      } finally {
        iframe.remove();
      }

      resolve({
        status: evalError ? 'error' : 'success',
        output: [],
        error: evalError,
        testResults,
      });
    };

    iframe.srcdoc = options.code;
  });
}
