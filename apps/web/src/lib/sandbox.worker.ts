import type {
  SandboxRequest,
  SandboxResponse,
  WorkerTestResult,
  LogEntry,
} from '@senatic/shared';

// ─── Global lockdown ──────────────────────────────────────────────────────────

const BLOCKED_MSG = 'Esta función no está disponible en el sandbox';
(self as any).fetch = () => { throw new Error(BLOCKED_MSG); };
(self as any).XMLHttpRequest = function () { throw new Error(BLOCKED_MSG); };
(self as any).WebSocket = function () { throw new Error(BLOCKED_MSG); };
(self as any).importScripts = () => { throw new Error(BLOCKED_MSG); };
(self as any).Notification = function () { throw new Error(BLOCKED_MSG); };

// ─── Console proxy ────────────────────────────────────────────────────────────

function buildConsoleProxy(): { proxy: typeof console; getLogs: () => LogEntry[] } {
  const logs: LogEntry[] = [];

  function serialize(args: unknown[]): string {
    return args
      .map((v) => {
        try {
          return JSON.stringify(v, null, 2);
        } catch {
          return String(v);
        }
      })
      .join(' ');
  }

  const proxy = {
    log: (...args: unknown[]) => logs.push({ type: 'log', text: serialize(args) }),
    warn: (...args: unknown[]) => logs.push({ type: 'warn', text: serialize(args) }),
    error: (...args: unknown[]) => logs.push({ type: 'error', text: serialize(args) }),
  } as unknown as typeof console;

  return { proxy, getLogs: () => logs };
}

// ─── Wrapper builder ──────────────────────────────────────────────────────────

function buildWrapper(
  code: string,
  tests: Array<{ description: string; expression: string }>,
): string {
  const isAsync = /\bawait\b/.test(code);
  const body = isAsync ? `await (async () => { ${code} })();` : code;

  const testBlocks = tests
    .map(
      (t) => `
  try {
    const __ok = Boolean(${t.expression});
    __results.push({ description: ${JSON.stringify(t.description)}, ok: __ok });
  } catch (__e) {
    __results.push({ description: ${JSON.stringify(t.description)}, ok: false, error: __e.message });
  }`,
    )
    .join('\n');

  return `
${body}

const __results = [];
${testBlocks}
return __results;
`;
}

// ─── Stack filter ─────────────────────────────────────────────────────────────

function filterStack(stack: string | undefined): string {
  if (!stack) return '';
  return stack
    .split('\n')
    .filter(
      (line) =>
        !line.includes('sandbox.worker') &&
        !line.includes('blob:') &&
        !line.includes('<anonymous>'),
    )
    .join('\n');
}

// ─── Message handler ──────────────────────────────────────────────────────────

self.onmessage = async (event: MessageEvent<SandboxRequest>) => {
  const { code, tests } = event.data;
  const { proxy, getLogs } = buildConsoleProxy();

  let error: string | null = null;
  let errorStack: string | undefined;
  let testResults: WorkerTestResult[] = [];

  try {
    const wrapper = buildWrapper(code, tests);
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction('console', wrapper);
    const raw: WorkerTestResult[] = await fn(proxy);
    testResults = raw;
  } catch (e: any) {
    error = e.message ?? String(e);
    errorStack = filterStack(e.stack);
    testResults = tests.map((t) => ({ description: t.description, ok: false }));
  }

  const response: SandboxResponse = {
    status: error ? 'error' : 'success',
    logs: getLogs(),
    error,
    testResults,
    errorStack,
  };

  (self as any).postMessage(response);
};
