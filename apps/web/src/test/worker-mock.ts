export class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;

  private _lastPosted: unknown = null;
  private _listeners: Record<string, EventListenerOrEventListenerObject[]> = {};

  postMessage(data: unknown): void {
    this._lastPosted = data;
  }

  get lastPosted(): unknown {
    return this._lastPosted;
  }

  __simulateMessage(data: unknown): void {
    const event = { data } as MessageEvent;
    this.onmessage?.(event);
  }

  __simulateError(message: string): void {
    const event = { message } as ErrorEvent;
    this.onerror?.(event);
  }

  terminate(): void {
    // no-op
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (!this._listeners[type]) return;
    this._listeners[type] = this._listeners[type].filter((l) => l !== listener);
  }
}
