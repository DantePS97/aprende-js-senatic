import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import { vi } from 'vitest';
import { MockWorker } from './src/test/worker-mock';

vi.stubGlobal('Worker', MockWorker);
