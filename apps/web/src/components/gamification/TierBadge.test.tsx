import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TierBadge } from './TierBadge';

describe('TierBadge', () => {
  // ─── Color classes per tier ─────────────────────────────────────────────────

  it('applies text-yellow-400 for gold tier', () => {
    const { container } = render(<TierBadge tier="gold" />);
    expect(container.firstChild).toHaveClass('text-yellow-400');
  });

  it('applies text-slate-300 for silver tier', () => {
    const { container } = render(<TierBadge tier="silver" />);
    expect(container.firstChild).toHaveClass('text-slate-300');
  });

  it('applies text-amber-600 for bronze tier', () => {
    const { container } = render(<TierBadge tier="bronze" />);
    expect(container.firstChild).toHaveClass('text-amber-600');
  });

  // ─── Label rendering ────────────────────────────────────────────────────────

  it('renders "Oro" label for gold', () => {
    render(<TierBadge tier="gold" />);
    expect(screen.getByText('Oro')).toBeInTheDocument();
  });

  it('renders "Plata" label for silver', () => {
    render(<TierBadge tier="silver" />);
    expect(screen.getByText('Plata')).toBeInTheDocument();
  });

  it('renders "Bronce" label for bronze', () => {
    render(<TierBadge tier="bronze" />);
    expect(screen.getByText('Bronce')).toBeInTheDocument();
  });

  it('hides label when showLabel=false', () => {
    render(<TierBadge tier="gold" showLabel={false} />);
    expect(screen.queryByText('Oro')).not.toBeInTheDocument();
  });

  // ─── Size variants ──────────────────────────────────────────────────────────

  it('renders sm size without crashing', () => {
    const { container } = render(<TierBadge tier="gold" size="sm" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders md size without crashing', () => {
    const { container } = render(<TierBadge tier="silver" size="md" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders lg size without crashing', () => {
    const { container } = render(<TierBadge tier="bronze" size="lg" />);
    expect(container.firstChild).toBeTruthy();
  });

  // ─── Accessibility ──────────────────────────────────────────────────────────

  it('has aria-label with tier name', () => {
    render(<TierBadge tier="gold" />);
    expect(screen.getByLabelText('Liga Oro')).toBeInTheDocument();
  });
});
