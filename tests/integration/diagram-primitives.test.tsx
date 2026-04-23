/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

import CausalDiagram from '@/components/causal-diagram';
import IcebergDiagram, { computeIcebergContainFit } from '@/components/iceberg-diagram';
import RoadmapRings, { ROADMAP_TOP_PADDING } from '@/components/roadmap-rings';
import ThreeHorizons from '@/components/three-horizons';

const nativeGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

function mockIcebergBoardRect(width: number, height: number) {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this instanceof HTMLElement && this.dataset.icebergBoard === 'true') {
      return {
        x: 0,
        y: 0,
        width,
        height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        toJSON() {
          return this;
        }
      } as DOMRect;
    }

    return nativeGetBoundingClientRect.call(this);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

function overlaps(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  const ax1 = a.x - a.width / 2;
  const ax2 = a.x + a.width / 2;
  const ay1 = a.y - a.height / 2;
  const ay2 = a.y + a.height / 2;
  const bx1 = b.x - b.width / 2;
  const bx2 = b.x + b.width / 2;
  const by1 = b.y - b.height / 2;
  const by2 = b.y + b.height / 2;

  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}

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

  it('renders portrait iceberg diagrams with layered labels and hoverable fitted notes', async () => {
    mockIcebergBoardRect(640, 360);
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

    const fit = computeIcebergContainFit({ containerWidth: 640, containerHeight: 360, visibleWidth: 1092 });

    await waitFor(() => {
      const viewport = container.querySelector('[data-iceberg-viewport="true"]');

      expect(viewport).toBeTruthy();
      expect(Number(viewport?.getAttribute('data-fit-left'))).toBe(0);
      expect(Number(viewport?.getAttribute('data-fit-top'))).toBe(0);
      expect(Number(viewport?.getAttribute('data-fit-width'))).toBeCloseTo(fit.renderWidth, 2);
      expect(Number(viewport?.getAttribute('data-fit-height'))).toBeCloseTo(fit.renderHeight, 2);
      expect(Number(viewport?.getAttribute('data-visible-width'))).toBe(1092);
    });
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

  it('renders simplified roadmap rings with upright labels, ring-attached phase badges, and hover tooltips', async () => {
    const { container } = render(
      <RoadmapRings
        props={{
          axes: {
            x: {
              label: 'Organisational structure, learnings and actions unfolding over time',
              items: ['Pilot: Incubating', 'Scale: Connecting', 'Practice: Embedded in the Regime']
            },
            y: {
              label: 'Network unfolding over time',
              items: ['Initiators', 'Organisational Ecosystem', 'Society']
            }
          },
          phases: [
            {
              label: 'Pilot: Incubating',
              dateRange: '2025-2027',
              size: 'sm',
              strategy: {
                title: 'Fairchain Music Collective',
                subtitle: 'Pilot platform for ethical AI music',
                items: [
                  {
                    label: 'Transparent provenance system',
                    detail:
                      '- Metadata tagging: Human / AI-Assisted / Fully AI / Hybrid\n- C2PA pilot for verification\n- One-click filter for human-certified work'
                  }
                ]
              },
              actors: {
                title: 'Actors / Stakeholders',
                items: [{ label: 'Early adopter artists', detail: '- Co-designers and beta testers.' }]
              },
              support: {
                title: 'System Support',
                items: [{ label: 'Legal templates', detail: '- Consent and privacy patterns.' }]
              }
            },
            {
              label: 'Scale: Connecting',
              dateRange: '2028-2032',
              size: 'md',
              strategy: {
                title: 'Ethical Music Network',
                subtitle: 'Federated ecosystem',
                items: [{ label: 'Interoperable standards', detail: '- Shared metadata across 10+ platforms.' }]
              },
              actors: {
                title: 'Actors / Stakeholders',
                items: [{ label: 'Platform partners', detail: '- Multiple platforms adopt the same standards.' }]
              },
              support: {
                title: 'System Support',
                items: [{ label: 'Knowledge networks', detail: '- Shared playbooks and convenings.' }]
              }
            },
            {
              label: 'Practice: Embedded in the Regime',
              dateRange: '2038-2040',
              size: 'lg',
              strategy: {
                title: 'Regenerative Music System',
                subtitle: 'The new normal',
                items: [{ label: 'Mandatory transparency', detail: '- Disclosure becomes a regulatory baseline.' }]
              },
              actors: {
                title: 'Actors / Stakeholders',
                items: [{ label: 'Policymakers', detail: '- Governments enforce the new norms.' }]
              },
              support: {
                title: 'System Support',
                items: [{ label: 'Policy enforcement', detail: '- Compliance and interoperability are audited.' }]
              }
            }
          ]
        }}
      />
    );

    expect(screen.getByRole('img', { name: 'Roadmap transition graph' })).toBeInTheDocument();
    expect(screen.queryByText('Network unfolding over time')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Organisational structure, learnings and actions unfolding over time')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Initiators')).not.toBeInTheDocument();
    expect(screen.queryByText('Organisational Ecosystem')).not.toBeInTheDocument();
    expect(screen.queryByText('Society')).not.toBeInTheDocument();
    expect(screen.getByText('Pilot: Incubating')).toBeInTheDocument();
    expect(container.textContent).toMatch(/Practice: Embedded in the\s*Regime/);
    expect(container.querySelectorAll('[data-roadmap-item="strategy"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-roadmap-item="actors"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-roadmap-item="support"]').length).toBeGreaterThan(0);

    const phaseEls = Array.from(container.querySelectorAll('[data-roadmap-phase]'));
    expect(phaseEls).toHaveLength(3);

    const phaseGeometry = phaseEls.map((phase) => ({
      x: Number(phase.getAttribute('data-center-x')),
      y: Number(phase.getAttribute('data-center-y')),
      r: Number(phase.getAttribute('data-outer-radius')),
      titleBottom: Number(phase.getAttribute('data-title-bottom'))
    }));

    const pilotScaleDistance = Math.hypot(phaseGeometry[1].x - phaseGeometry[0].x, phaseGeometry[1].y - phaseGeometry[0].y);
    const scalePracticeDistance = Math.hypot(phaseGeometry[2].x - phaseGeometry[1].x, phaseGeometry[2].y - phaseGeometry[1].y);
    const phaseBottoms = phaseGeometry.map((phase) => phase.y + phase.r);
    expect(Math.abs(pilotScaleDistance - (phaseGeometry[0].r + phaseGeometry[1].r))).toBeLessThan(0.5);
    expect(Math.abs(scalePracticeDistance - (phaseGeometry[1].r + phaseGeometry[2].r))).toBeLessThan(0.5);
    expect(Math.max(...phaseBottoms) - Math.min(...phaseBottoms)).toBeLessThan(0.5);
    expect(phaseGeometry[2].y - phaseGeometry[2].r).toBeGreaterThanOrEqual(ROADMAP_TOP_PADDING);

    const actorBands = Array.from(container.querySelectorAll('[data-roadmap-band="actors"]'));
    const supportBands = Array.from(container.querySelectorAll('[data-roadmap-band="support"]'));
    expect(actorBands).toHaveLength(3);
    expect(supportBands).toHaveLength(3);
    expect(actorBands.every((band) => Number(band.getAttribute('data-rotation')) === 0)).toBe(true);
    expect(supportBands.every((band) => Number(band.getAttribute('data-rotation')) === 0)).toBe(true);
    expect(container.querySelectorAll('[data-roadmap-band] rect')).toHaveLength(0);
    expect(container.querySelector('[data-roadmap-shell="true"]')).toBeTruthy();

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    const viewBoxWidth = Number(svg?.getAttribute('viewBox')?.split(/\s+/)[2]);
    const viewBoxHeight = Number(svg?.getAttribute('viewBox')?.split(/\s+/)[3]);
    expect(viewBoxWidth).toBeGreaterThan(0);
    expect(viewBoxHeight).toBeGreaterThan(0);

    actorBands.forEach((band, index) => {
      expect(Number(band.getAttribute('data-x'))).toBeCloseTo(phaseGeometry[index].x, 1);
      expect(Number(band.getAttribute('data-y'))).toBeLessThan(phaseGeometry[index].y);
    });

    supportBands.forEach((band, index) => {
      expect(Number(band.getAttribute('data-x'))).toBeCloseTo(phaseGeometry[index].x, 1);
      expect(Number(band.getAttribute('data-y'))).toBeGreaterThan(phaseGeometry[index].y);
    });

    const phaseBadges = Array.from(container.querySelectorAll('[data-roadmap-phase-badge]'));
    expect(phaseBadges).toHaveLength(3);
    expect(screen.getByText('2025-2027')).toBeInTheDocument();
    expect(screen.getByText('2028-2032')).toBeInTheDocument();
    expect(screen.getByText('2038-2040')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-roadmap-phase-badge] rect')).toHaveLength(0);
    phaseBadges.forEach((badge, index) => {
      expect(Number(badge.getAttribute('data-x'))).toBeCloseTo(phaseGeometry[index].x, 1);
      expect(Number(badge.getAttribute('data-y'))).toBeGreaterThan(phaseGeometry[index].y);
    });

    const actorChips = Array.from(container.querySelectorAll('[data-roadmap-item="actors"]'));
    const supportChips = Array.from(container.querySelectorAll('[data-roadmap-item="support"]'));
    const strategyChips = Array.from(container.querySelectorAll('[data-roadmap-item="strategy"]'));

    expect(
      actorChips.every((chip) => Number(chip.getAttribute('data-center-y')) < Number(chip.getAttribute('data-phase-center-y')))
    ).toBe(true);
    expect(
      supportChips.every((chip) => Number(chip.getAttribute('data-center-y')) > Number(chip.getAttribute('data-phase-center-y')))
    ).toBe(true);
    expect(
      strategyChips.every((chip) => Number(chip.getAttribute('data-center-y')) > Number(chip.getAttribute('data-title-boundary')))
    ).toBe(true);

    const leftmostContent = Math.min(
      ...phaseGeometry.map((phase) => phase.x - phase.r),
      ...actorBands.map((band) => Number(band.getAttribute('data-x')) - Number(band.getAttribute('data-width')) / 2),
      ...supportBands.map((band) => Number(band.getAttribute('data-x')) - Number(band.getAttribute('data-width')) / 2),
      ...phaseBadges.map((badge) => Number(badge.getAttribute('data-x')) - Number(badge.getAttribute('data-width')) / 2),
      ...[...actorChips, ...supportChips, ...strategyChips].map(
        (chip) => Number(chip.getAttribute('data-center-x')) - Number(chip.getAttribute('data-width')) / 2
      )
    );
    expect(leftmostContent).toBeCloseTo(24, 1);
    expect(leftmostContent).toBeLessThan(viewBoxWidth / 4);

    const topmostContent = Math.min(
      ...phaseGeometry.map((phase) => phase.y - phase.r),
      ...actorBands.map((band) => Number(band.getAttribute('data-y')) - Number(band.getAttribute('data-height')) / 2),
      ...supportBands.map((band) => Number(band.getAttribute('data-y')) - Number(band.getAttribute('data-height')) / 2),
      ...phaseBadges.map((badge) => Number(badge.getAttribute('data-y')) - Number(badge.getAttribute('data-height')) / 2),
      ...[...actorChips, ...supportChips, ...strategyChips].map(
        (chip) => Number(chip.getAttribute('data-center-y')) - Number(chip.getAttribute('data-height')) / 2
      )
    );
    expect(topmostContent).toBeCloseTo(ROADMAP_TOP_PADDING, 1);
    expect(topmostContent).toBeLessThan(viewBoxHeight / 4);

    for (const phaseIndex of ['1', '2']) {
      const phaseActors = actorChips
        .filter((chip) => chip.getAttribute('data-phase-index') === phaseIndex)
        .map((chip) => ({
          x: Number(chip.getAttribute('data-center-x')),
          y: Number(chip.getAttribute('data-center-y')),
          width: Number(chip.getAttribute('data-width')),
          height: Number(chip.getAttribute('data-height'))
        }));
      const phaseSupports = supportChips
        .filter((chip) => chip.getAttribute('data-phase-index') === phaseIndex)
        .map((chip) => ({
          x: Number(chip.getAttribute('data-center-x')),
          y: Number(chip.getAttribute('data-center-y')),
          width: Number(chip.getAttribute('data-width')),
          height: Number(chip.getAttribute('data-height'))
        }));

      for (let index = 0; index < phaseActors.length; index += 1) {
        for (let compareIndex = index + 1; compareIndex < phaseActors.length; compareIndex += 1) {
          expect(overlaps(phaseActors[index], phaseActors[compareIndex])).toBe(false);
        }
      }

      for (let index = 0; index < phaseSupports.length; index += 1) {
        for (let compareIndex = index + 1; compareIndex < phaseSupports.length; compareIndex += 1) {
          expect(overlaps(phaseSupports[index], phaseSupports[compareIndex])).toBe(false);
        }
      }
    }

    fireEvent.mouseEnter(screen.getByRole('button', { name: /transparent provenance system/i }));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Transparent provenance system');
    expect(tooltip).toHaveTextContent('Metadata tagging: Human / AI-Assisted / Fully AI / Hybrid');
    expect(container.querySelector('[data-roadmap-phase="1"]')?.getAttribute('style')).toContain('var(--color-');
    expect(container.querySelector('[data-roadmap-item="strategy"]')?.getAttribute('style')).toContain('var(--color-');
  });
});
