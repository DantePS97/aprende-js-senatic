import { render as rtlRender, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

export * from '@testing-library/react';

export function render(ui: ReactElement, options?: RenderOptions) {
  const user = userEvent.setup();
  const result = rtlRender(ui, options);
  return { user, ...result };
}
