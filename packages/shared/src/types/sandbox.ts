export type SandboxStatus = 'success' | 'error' | 'timeout';

export interface LogEntry {
  type: 'log' | 'warn' | 'error';
  text: string;
}

export interface WorkerTestResult {
  description: string;
  ok: boolean;
  error?: string;
}

export interface SandboxRequest {
  code: string;
  tests: Array<{ description: string; expression: string }>;
}

export interface SandboxResponse {
  status: SandboxStatus;
  logs: LogEntry[];
  error: string | null;
  testResults: WorkerTestResult[];
  errorStack?: string;
}

// ─── Public API (consumed by ExercisePanel) ───────────────────────────────────

export interface RunOptions {
  code: string;
  tests: Array<{ description: string; expression: string }>;
}

export interface TestResult {
  description: string;
  passed: boolean;
  error?: string;
}

export interface SandboxResult {
  status: SandboxStatus;
  output: string[];
  error: string | null;
  testResults: TestResult[];
  errorStack?: string;
}
