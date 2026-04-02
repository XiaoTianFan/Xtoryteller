/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';

import BodyText from '@/components/body-text';
import BlockQuote from '@/components/blockquote';
import ChapterNav from '@/components/chapter-nav';
import EdgeRail from '@/components/edge-rail';

describe('editorial primitives', () => {
  it('renders edge rails with variant metadata and active state', () => {
    render(
      <EdgeRail
        props={{
          variant: 'tabs',
          orientation: 'vertical',
          items: [{ label: 'intro', height: 'short', active: true }, { label: 'proof', height: 'medium' }]
        }}
      />
    );

    expect(screen.getByLabelText('Edge rail')).toHaveAttribute('data-variant', 'tabs');
    expect(screen.getByText('intro').closest('[data-active]')).toHaveAttribute('data-active', 'true');
  });

  it('renders chapter navigation with the active entry marked', () => {
    render(<ChapterNav props={{ items: ['opening', 'story', 'proof'], active: 1, orientation: 'vertical' }} />);

    expect(screen.getByLabelText('Chapter navigation')).toHaveAttribute('data-orientation', 'vertical');
    expect(screen.getByText('story').closest('[data-active]')).toHaveAttribute('data-active', 'true');
  });

  it('marks drop-cap prose and quote variants for styling hooks', () => {
    const { rerender } = render(<BodyText content="First paragraph." props={{ dropCap: true, dropCapLines: 4 }} />);

    expect(screen.getByText('First paragraph.').closest('[data-drop-cap]')).toHaveAttribute('data-drop-cap', 'true');

    rerender(<BlockQuote content="Editorial emphasis." props={{ variant: 'large', attribution: 'Preset' }} />);

    expect(screen.getByText('Editorial emphasis.').closest('[data-variant]')).toHaveAttribute('data-variant', 'large');
    expect(screen.getByText('Preset')).toBeInTheDocument();
  });
});
