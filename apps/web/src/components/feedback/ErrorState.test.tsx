import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/render';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('renders the title', () => {
    render(<ErrorState title="Oops" description="Something broke" reset={vi.fn()} />);
    expect(screen.getByText('Oops')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<ErrorState title="T" description="Lo sentimos, intenta de nuevo." reset={vi.fn()} />);
    expect(screen.getByText('Lo sentimos, intenta de nuevo.')).toBeInTheDocument();
  });

  it('calls reset when retry button is clicked', async () => {
    const onReset = vi.fn();
    const { user } = render(
      <ErrorState title="T" description="D" reset={onReset} />,
    );
    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('shows digest when provided', () => {
    render(
      <ErrorState title="T" description="D" reset={vi.fn()} digest="abc-123" />,
    );
    expect(screen.getByText(/abc-123/)).toBeInTheDocument();
  });

  it('does not show digest element when digest is absent', () => {
    render(<ErrorState title="T" description="D" reset={vi.fn()} />);
    expect(screen.queryByText(/ID:/)).not.toBeInTheDocument();
  });
});
