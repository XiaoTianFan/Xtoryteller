/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import CausalDiagram from '@/components/causal-diagram';
import IcebergDiagram from '@/components/iceberg-diagram';
import ThreeHorizons from '@/components/three-horizons';

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

  it('renders rich three-horizons note boxes with hover tooltips and markdown detail', async () => {
    render(
      <ThreeHorizons
        props={{
          horizon1: {
            label: 'Horizon 1',
            color: 'var(--color-warning)',
            boxes: [
              {
                title: '3 - Current System Concerns',
                notes: [{ label: 'Pro-Rata Streaming Royalty Model', detail: 'Current failure mode.' }]
              },
              {
                title: '4 - Elements of the Current System to Retain',
                notes: [{ label: 'Metadata Standards', detail: 'Keep tags, but add provenance.' }]
              }
            ]
          },
          horizon2: {
            label: 'Horizon 2',
            color: 'var(--color-primary)',
            boxes: [
              {
                title: '5 - Intermediate Innovations (Temporary)',
                notes: [{ label: 'Human Music Certification Labels', detail: 'Voluntary labels create market pressure.' }]
              },
              {
                title: '6 - Elements of the Current System to Repurpose',
                notes: [
                  {
                    label: 'Repurpose PROs (ASCAP/BMI) as AI Training Registries',
                    detail: 'Current function. **New use:** Track training datasets and distribute royalties.'
                  }
                ]
              }
            ]
          },
          horizon3: {
            label: 'Horizon 3',
            color: 'var(--color-success)',
            boxes: [
              {
                title: '1 - Vision of the (Ideal) Future',
                notes: [{ label: 'Consent-First AI Training Economy', detail: 'Creators opt in and receive royalties.' }]
              },
              {
                title: '2 - Pockets of the Future in the Present',
                notes: [{ label: 'C2PA Content Provenance Standard', detail: 'Cryptographic origin labels.' }]
              }
            ]
          },
          timeLabels: {
            start: '2025',
            mid: '2030',
            end: '2040'
          }
        }}
      />
    );

    expect(screen.getByText('3 - Current System Concerns')).toBeInTheDocument();
    expect(screen.getByText('5 - Intermediate Innovations (Temporary)')).toBeInTheDocument();
    expect(screen.getByText('1 - Vision of the (Ideal) Future')).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByRole('button', { name: /repurpose pros/i }));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Repurpose PROs');
    expect(tooltip).toHaveTextContent('Track training datasets and distribute royalties.');
    expect(tooltip.querySelector('strong')).toHaveTextContent('New use:');
  });

  it('keeps legacy three-horizons rendering summary columns', () => {
    render(
      <ThreeHorizons
        props={{
          horizon1: {
            label: 'Foundation',
            items: ['Stage runtime', 'YAML loader']
          },
          horizon2: {
            label: 'Expansion',
            items: ['Map mode']
          },
          horizon3: {
            label: 'Portable system',
            items: ['Export/import']
          },
          timeLabels: {
            start: 'Phase 1',
            mid: 'Phase 2',
            end: 'Next'
          }
        }}
      />
    );

    expect(screen.getAllByText('Foundation')).toHaveLength(2);
    expect(screen.getByText('Stage runtime')).toBeInTheDocument();
    expect(screen.getAllByText('Portable system')).toHaveLength(2);
    expect(screen.getByText('Export/import')).toBeInTheDocument();
  });
});
