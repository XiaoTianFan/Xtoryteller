/** @vitest-environment jsdom */
import { render, screen, waitFor } from '@testing-library/react';

import CausalDiagram from '@/components/causal-diagram';
import IcebergDiagram from '@/components/iceberg-diagram';

describe('diagram primitives', () => {
  it('renders ELK-backed causal diagrams with grouped labels and S/O-only edge badges', async () => {
    const { container } = render(
      <CausalDiagram
        props={{
          canvas: { width: 800, height: 400 },
          layout: { direction: 'RIGHT', nodeSpacing: 48, layerSpacing: 72 },
          annotations: [{ label: 'Context band', x: 24, y: 22 }],
          groups: [{ id: 'r1', label: 'R1 Loop', members: ['a', 'b', 'c'], tone: 'accent' }],
          nodes: [
            { id: 'a', label: 'Node A', tone: 'warning' },
            { id: 'b', label: 'Node B', detail: 'Shared concept', tone: 'primary' },
            { id: 'c', label: 'Node C', tone: 'secondary' }
          ],
          edges: [
            { source: 'a', target: 'b', polarity: '+', tone: 'accent' },
            {
              source: 'b',
              target: 'c',
              label: '-',
              tone: 'primary'
            },
            { source: 'c', target: 'a', label: '0' }
          ]
        }}
      />
    );

    expect(screen.getByRole('img', { name: 'Causal diagram' })).toBeInTheDocument();
    await waitFor(() => expect(container.querySelector('[data-layout-engine="elk"]')).toBeTruthy());
    expect(screen.getByText('Node A')).toBeInTheDocument();
    expect(screen.getByText('Node B')).toBeInTheDocument();
    expect(screen.getByText('Node C')).toBeInTheDocument();
    expect(screen.getByText('R1 Loop')).toBeInTheDocument();
    expect(screen.getByText('Context band')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('O')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(screen.queryByText('+')).not.toBeInTheDocument();
    expect(container.querySelector('[data-node-id="a"] rect')?.getAttribute('fill')).toContain('var(--color');
    expect(container.querySelector('[data-edge-id="edge-0"] path')?.getAttribute('stroke')).toContain('var(--color');
  });

  it('renders portrait iceberg diagrams with layered labels and hoverable fitted notes', () => {
    const { container } = render(
      <IcebergDiagram
        props={{
          waterlinePosition: 0.23,
          layers: [
            {
              depth: 'litany',
              label: 'LITANY',
              items: ['How has AI affected your income this year?', 'What did you notice first?', 'What changed?']
            },
            {
              depth: 'structures',
              label: 'STRUCTURES & SYSTEMS',
              items: ['Who controls the infrastructure?', 'How do platforms shape discovery?', 'What incentives drive supply?', 'What does policy lag do?']
            },
            {
              depth: 'worldview',
              label: 'WORLDVIEW & VALUES',
              items: ['Can AI-made music be authentic?', 'What counts as authorship?', 'What does creativity mean now?']
            },
            {
              depth: 'myths',
              label: 'DEEP MYTHS',
              items: ['If abundance destroys scarcity, what creates value?', 'What metaphor explains music now?']
            }
          ]
        }}
      />
    );

    expect(screen.getByRole('img', { name: 'Iceberg diagram' })).toBeInTheDocument();
    expect(screen.getByText('LITANY')).toBeInTheDocument();
    expect(screen.getByText('STRUCTURES & SYSTEMS')).toBeInTheDocument();
    expect(screen.getByText('WORLDVIEW & VALUES')).toBeInTheDocument();
    expect(screen.getByText('DEEP MYTHS')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(12);
    expect(screen.getByRole('button', { name: /How has AI affected your income this year/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /If abundance destroys scarcity/i })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-iceberg-note="true"]')).toHaveLength(12);
    expect(container.querySelectorAll('line')).toHaveLength(3);
  });
});
