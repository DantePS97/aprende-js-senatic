'use client';

export interface SandboxResult {
  output: string[];
  error: string | null;
  testResults: TestResult[];
}

export interface TestResult {
  description: string;
  passed: boolean;
  error?: string;
}

export interface RunOptions {
  code: string;
  tests: Array<{ description: string; expression: string }>;
}

// El HTML del iframe sandbox — intercepta console.log y ejecuta tests
const SANDBOX_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
  const logs = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  function formatValue(v) {
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';
    if (typeof v === 'object') {
      try { return JSON.stringify(v, null, 2); } catch { return String(v); }
    }
    return String(v);
  }

  console.log = (...args) => logs.push({ type: 'log', text: args.map(formatValue).join(' ') });
  console.error = (...args) => logs.push({ type: 'error', text: args.map(formatValue).join(' ') });
  console.warn = (...args) => logs.push({ type: 'warn', text: args.map(formatValue).join(' ') });

  window.addEventListener('message', function(event) {
    if (event.data.type !== 'RUN_CODE') return;

    logs.length = 0;
    const { code, tests } = event.data;
    let runtimeError = null;
    const testResults = [];

    try {
      // Ejecutar el código del estudiante
      const fn = new Function(code);
      fn();
    } catch (e) {
      runtimeError = e.message;
    }

    // Evaluar cada test en el mismo contexto (código ya ejecutado)
    for (const test of tests) {
      try {
        const result = new Function(code + '\\n; return (' + test.expression + ');')();
        testResults.push({ description: test.description, passed: Boolean(result) });
      } catch (e) {
        testResults.push({ description: test.description, passed: false, error: e.message });
      }
    }

    event.source.postMessage({
      type: 'RUN_RESULT',
      output: logs,
      error: runtimeError,
      testResults,
    }, event.origin || '*');
  });
</script>
</body>
</html>`;

const SANDBOX_BLOB_URL = typeof window !== 'undefined'
  ? URL.createObjectURL(new Blob([SANDBOX_HTML], { type: 'text/html' }))
  : '';

let sandboxFrame: HTMLIFrameElement | null = null;

function getSandboxFrame(): HTMLIFrameElement {
  if (sandboxFrame && document.body.contains(sandboxFrame)) {
    return sandboxFrame;
  }

  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:absolute;width:0;height:0;border:0;opacity:0;pointer-events:none;';
  frame.src = SANDBOX_BLOB_URL;

  document.body.appendChild(frame);
  sandboxFrame = frame;
  return frame;
}

export function runInSandbox(options: RunOptions, timeoutMs = 5000): Promise<SandboxResult> {
  return new Promise((resolve) => {
    const frame = getSandboxFrame();

    let resolved = false;

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.removeEventListener('message', handler);
        resolve({
          output: [],
          error: 'Tiempo de ejecución agotado (posible bucle infinito)',
          testResults: options.tests.map((t) => ({ description: t.description, passed: false })),
        });
      }
    }, timeoutMs);

    function handler(event: MessageEvent) {
      if (event.data?.type !== 'RUN_RESULT') return;
      if (resolved) return;

      resolved = true;
      clearTimeout(timeoutId);
      window.removeEventListener('message', handler);

      resolve({
        output: event.data.output.map((l: { type: string; text: string }) => l.text),
        error: event.data.error,
        testResults: event.data.testResults,
      });
    }

    window.addEventListener('message', handler);

    // Esperar a que el iframe cargue si es la primera vez
    if (frame.contentWindow) {
      frame.contentWindow.postMessage(
        { type: 'RUN_CODE', code: options.code, tests: options.tests },
        '*'
      );
    } else {
      frame.onload = () => {
        frame.contentWindow!.postMessage(
          { type: 'RUN_CODE', code: options.code, tests: options.tests },
          '*'
        );
      };
    }
  });
}
