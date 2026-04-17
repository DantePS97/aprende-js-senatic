import { describe, it, expect } from 'vitest';
import type {
  SandboxStatus,
  LogEntry,
  WorkerTestResult,
  SandboxRequest,
  SandboxResponse,
  RunOptions,
  TestResult,
  SandboxResult,
} from './sandbox';

// No runtime type guards exist — use compile-time satisfies assertions
// to verify the shape of each type is what we expect.

describe('sandbox types — compile-time shape contracts', () => {
  it('SandboxStatus covers all three states', () => {
    const states: SandboxStatus[] = ['success', 'error', 'timeout'];
    expect(states).toHaveLength(3);
  });

  it('LogEntry has type and text fields', () => {
    const entry = { type: 'log', text: 'hello' } satisfies LogEntry;
    expect(entry.type).toBe('log');
    expect(entry.text).toBe('hello');
  });

  it('WorkerTestResult maps to ok boolean', () => {
    const passing = { description: 'should work', ok: true } satisfies WorkerTestResult;
    const failing = { description: 'should fail', ok: false, error: 'oops' } satisfies WorkerTestResult;
    expect(passing.ok).toBe(true);
    expect(failing.ok).toBe(false);
  });

  it('SandboxRequest holds code and tests array', () => {
    const req = {
      code: 'console.log(1)',
      tests: [{ description: 'outputs 1', expression: 'true' }],
    } satisfies SandboxRequest;
    expect(req.tests).toHaveLength(1);
  });

  it('SandboxResponse has all required fields', () => {
    const resp = {
      status: 'success' as SandboxStatus,
      logs: [],
      error: null,
      testResults: [],
    } satisfies SandboxResponse;
    expect(resp.status).toBe('success');
    expect(resp.error).toBeNull();
  });

  it('TestResult uses passed (not ok)', () => {
    const result = { description: 'adds 1+1', passed: true } satisfies TestResult;
    expect(result.passed).toBe(true);
  });

  it('SandboxResult includes status, output, error, testResults', () => {
    const result = {
      status: 'timeout' as SandboxStatus,
      output: [],
      error: 'Tiempo agotado',
      testResults: [],
    } satisfies SandboxResult;
    expect(result.status).toBe('timeout');
  });

  it('RunOptions mirrors SandboxRequest shape', () => {
    const opts = {
      code: 'let x = 1',
      tests: [{ description: 'x is 1', expression: 'x === 1' }],
    } satisfies RunOptions;
    expect(opts.code).toBe('let x = 1');
  });
});
