export interface PanelState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function initialPanel<T>(): PanelState<T> {
  return { data: null, loading: false, error: null };
}
