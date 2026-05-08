'use client';

import type { CSSProperties, ReactNode } from 'react';

import { AnnotationProvider } from '@/components/_shared/annotation-context';
import { resolveBackgroundState, type ResolvedBackgroundAppearance } from '@/lib/runtime/background-config';
import {
  buildMapPdfPage,
  buildStagePdfPages,
  collectPdfExportWarnings,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_WIDTH,
  PDF_REVEAL_ALL,
  type PdfExportWarning,
  type PdfMapPage,
  type PdfRenderItem,
  type PdfStagePage
} from '@/lib/runtime/pdf-export';
import { resolvePaperShaderDefinition } from '@/lib/runtime/paper-shaders';
import { resolveRuntimeComponent, resolveRuntimeLayout } from '@/lib/runtime/primitive-resolver';
import type { ClusterDefinition, ComponentInstance, PresentationConfig } from '@/lib/types/presentation';
import type { ThemeConfig } from '@/lib/types/theme';

const hoverableTypes = new Set(['card', 'callout', 'comparison-card', 'feature-card', 'profile-card', 'stat-card', 'timeline-item']);

function staticPaperShaderParams(params: Record<string, unknown> | undefined) {
  return Object.fromEntries(
    Object.entries(params ?? {}).map(([key, value]) => {
      if (key === 'speed' || key === 'frame') {
        return [key, 0];
      }

      return [key, value];
    })
  );
}

function PdfBackgroundSurface({ appearance }: { appearance: ResolvedBackgroundAppearance }) {
  if (appearance.kind === 'none') {
    return null;
  }

  if (appearance.kind === 'css') {
    return (
      <>
        <div className="backgroundSurface" style={{ background: appearance.value }} />
        <div className="backgroundNoise" />
        <div className="backgroundPattern" />
      </>
    );
  }

  const definition = resolvePaperShaderDefinition(appearance.shader);
  if (!definition || !appearance.shader) {
    return <div className="backgroundSurface" style={{ background: appearance.value ?? 'var(--color-background)' }} />;
  }

  const ShaderComponent = definition.component;
  return (
    <>
      <div className="backgroundSurface backgroundSurfaceShader">
        <ShaderComponent
          {...staticPaperShaderParams(appearance.params)}
          aria-hidden="true"
          className="paperShaderCanvas"
          width="100%"
          height="100%"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />
      </div>
      <div className="backgroundPattern" />
    </>
  );
}

function PdfStaticBackground({
  presentation,
  theme,
  stepIndex,
  clusterId
}: {
  presentation: PresentationConfig;
  theme: ThemeConfig;
  stepIndex: number;
  clusterId: string | null;
}) {
  const backgroundState = resolveBackgroundState(presentation, stepIndex, clusterId, theme);

  return (
    <div
      aria-hidden="true"
      className="backgroundLayer pdfBackgroundLayer"
      data-background-kind={backgroundState.appearance.kind}
      data-background-key={backgroundState.appearance.key}
      data-background-shader={backgroundState.appearance.shader ?? ''}
      data-background-preset={backgroundState.appearance.preset ?? ''}
      style={{ opacity: backgroundState.appearance.opacity }}
    >
      <PdfBackgroundSurface appearance={backgroundState.appearance} />
      {backgroundState.appearance.kind === 'paper-shader' && backgroundState.appearance.filter ? (
        <div className="backgroundFilter" style={{ background: backgroundState.appearance.filter.value }} />
      ) : null}
    </div>
  );
}

function resolvePrintableMediaLabel(component: ComponentInstance) {
  if (component.type === 'video') {
    return {
      title: 'Video',
      detail: typeof component.props?.caption === 'string' ? component.props.caption : 'Open the source deck to play this media.'
    };
  }

  return {
    title: typeof component.props?.title === 'string' ? component.props.title : 'Embedded content',
    detail: typeof component.props?.src === 'string' ? component.props.src : 'Open the source deck to view this embed.'
  };
}

function PdfMediaFallback({ component, style }: { component: ComponentInstance; style?: CSSProperties }) {
  const src = typeof component.props?.src === 'string' ? component.props.src : '';
  const { title, detail } = resolvePrintableMediaLabel(component);
  const body = (
    <figure className="pdfMediaFallback" style={style}>
      <strong>{title}</strong>
      <figcaption>{detail}</figcaption>
    </figure>
  );

  return src ? (
    <a className="pdfMediaFallbackLink" href={src}>
      {body}
    </a>
  ) : (
    body
  );
}

function PdfComponentRenderer({
  component,
  revealCount,
  slug,
  compact
}: {
  component: ComponentInstance;
  revealCount: number;
  slug: string;
  compact?: boolean;
}) {
  if (component.type === 'video' || component.type === 'iframe-embed') {
    return <PdfMediaFallback component={component} style={component.style as CSSProperties | undefined} />;
  }

  const Selected = resolveRuntimeComponent(slug, component.type);
  if (!Selected) {
    return (
      <article className="missingPrimitive">
        <p>Unknown component: {component.type}</p>
      </article>
    );
  }

  const resolvedStyle =
    compact && ['headline', 'subtitle', 'body-text', 'bullet-list', 'numbered-list', 'blockquote'].includes(component.type)
      ? ({
          ...(component.style as CSSProperties | undefined),
          maxWidth: '100%',
          width: '100%'
        } satisfies CSSProperties)
      : (component.style as CSSProperties | undefined);

  return (
    <AnnotationProvider annotations={component.annotations}>
      <Selected
        content={component.content}
        props={component.props}
        style={resolvedStyle}
        revealCount={revealCount}
        slug={slug}
      />
    </AnnotationProvider>
  );
}

function PdfLayoutRenderer({
  slug,
  layout,
  layoutProps,
  items,
  compact
}: {
  slug: string;
  layout: string;
  layoutProps?: Record<string, unknown>;
  items: PdfRenderItem[];
  compact?: boolean;
}) {
  const Selected = resolveRuntimeLayout(slug, layout);
  const renderedEntries = items.map((item, index) => ({
    component: item.component,
    node: (
      <div
        key={`${item.component.type}-${index}`}
        className={hoverableTypes.has(item.component.type) ? 'layoutRevealCard' : 'layoutRevealItem'}
        data-layout-item-index={index}
      >
        <PdfComponentRenderer
          component={item.component}
          revealCount={item.revealCount}
          slug={slug}
          compact={compact}
        />
      </div>
    )
  }));

  if (!Selected) {
    return <PdfLayoutRenderer slug={slug} layout="single-content" items={items} compact={compact} />;
  }

  return (
    <Selected
      items={renderedEntries.map((entry) => entry.node)}
      entries={renderedEntries}
      compact={compact}
      layoutProps={layoutProps}
    />
  );
}

function PdfStagePageView({
  presentation,
  theme,
  page
}: {
  presentation: PresentationConfig;
  theme: ThemeConfig;
  page: PdfStagePage;
}) {
  return (
    <article
      className="pdfPage pdfStagePage"
      data-pdf-page={`${page.pageIndex + 1}`}
      data-pdf-kind="stage"
      data-pdf-step-index={page.stepIndex}
    >
      <PdfStaticBackground presentation={presentation} theme={theme} stepIndex={page.stepIndex} clusterId={null} />
      <section className="pdfStepScene">
        {page.step.title || page.step.description ? (
          <header className="stepSceneHeader pdfStepSceneHeader">
            {page.step.title ? <p className="stepSceneTitle">{page.step.title}</p> : null}
            {page.step.description ? <p className="stepSceneDescription">{page.step.description}</p> : null}
          </header>
        ) : null}
        <div className="stepSceneBody pdfStepSceneBody">
          <PdfLayoutRenderer
            slug={presentation.meta.slug}
            layout={page.step.layout}
            layoutProps={page.step.layoutProps}
            items={page.items}
          />
        </div>
      </section>
    </article>
  );
}

function PdfClusterCard({
  slug,
  cluster
}: {
  slug: string;
  cluster: PdfMapPage['clusters'][number];
}) {
  const clusterLabelPosition = cluster.cluster.labelPosition ?? 'top-left';

  return (
    <section
      className="clusterCard pdfClusterCard"
      style={{ left: cluster.x, top: cluster.y, width: cluster.width, height: cluster.height }}
      data-cluster-id={cluster.id}
    >
      <div
        className={`clusterCardHeader ${
          clusterLabelPosition === 'top-right'
            ? 'clusterCardHeaderTopRight'
            : clusterLabelPosition === 'bottom-left'
              ? 'clusterCardHeaderBottomLeft'
              : clusterLabelPosition === 'bottom-right'
                ? 'clusterCardHeaderBottomRight'
                : 'clusterCardHeaderTopLeft'
        }`}
        data-cluster-label-position={clusterLabelPosition}
      >
        <span className="clusterBadge">{cluster.cluster.group ?? 'Cluster'}</span>
        <span className="clusterCardTitle">{cluster.cluster.title ?? cluster.cluster.id}</span>
      </div>
      <div className="clusterCardContent">
        <PdfLayoutRenderer
          slug={slug}
          layout={cluster.cluster.layout}
          layoutProps={cluster.cluster.layoutProps}
          compact
          items={cluster.cluster.components.map((component) => ({
            component,
            revealCount: PDF_REVEAL_ALL
          }))}
        />
      </div>
    </section>
  );
}

function PdfMapPageView({
  presentation,
  theme,
  page
}: {
  presentation: PresentationConfig;
  theme: ThemeConfig;
  page: PdfMapPage;
}) {
  return (
    <article className="pdfPage pdfMapPage" data-pdf-page="1" data-pdf-kind="map">
      <PdfStaticBackground presentation={presentation} theme={theme} stepIndex={0} clusterId={null} />
      <div className="mapViewport pdfMapViewport" style={{ width: PDF_PAGE_WIDTH, height: PDF_PAGE_HEIGHT }}>
        <div
          className="mapCanvas pdfMapCanvas"
          style={{
            width: PDF_PAGE_WIDTH,
            height: PDF_PAGE_HEIGHT,
            transform: `translate(${page.transform.x}px, ${page.transform.y}px) scale(${page.transform.scale})`
          }}
        >
          {page.clusters.map((cluster) => (
            <PdfClusterCard key={cluster.id} slug={presentation.meta.slug} cluster={cluster} />
          ))}
        </div>
      </div>
    </article>
  );
}

function PdfWarningList({ warnings }: { warnings: PdfExportWarning[] }) {
  return (
    <div className="pdfExportWarnings" aria-hidden="true">
      {warnings.map((warning) => (
        <p key={`${warning.code}:${warning.target}`} data-pdf-warning={warning.code}>
          {warning.message}
        </p>
      ))}
    </div>
  );
}

export function PdfExportRenderer({
  presentation,
  theme,
  pdfPage
}: {
  presentation: PresentationConfig;
  theme: ThemeConfig;
  pdfPage?: number;
}) {
  const warnings = collectPdfExportWarnings(presentation);
  const stagePages = presentation.mode === 'map' ? [] : buildStagePdfPages(presentation);
  const selectedStagePage =
    typeof pdfPage === 'number' && pdfPage >= 1 && pdfPage <= stagePages.length ? stagePages[pdfPage - 1] : null;
  const pages: ReactNode =
    presentation.mode === 'map' ? (
      <PdfMapPageView presentation={presentation} theme={theme} page={buildMapPdfPage(presentation)} />
    ) : selectedStagePage ? (
      <PdfStagePageView
        key={selectedStagePage.step.id ?? selectedStagePage.stepIndex}
        presentation={presentation}
        theme={theme}
        page={selectedStagePage}
      />
    ) : (
      stagePages.map((page) => (
        <PdfStagePageView key={page.step.id ?? page.stepIndex} presentation={presentation} theme={theme} page={page} />
      ))
    );

  return (
    <main
      className="pdfExportShell"
      data-pdf-ready="true"
      data-pdf-mode={presentation.mode}
      data-pdf-page-width={PDF_PAGE_WIDTH}
      data-pdf-page-height={PDF_PAGE_HEIGHT}
      data-pdf-total-pages={presentation.mode === 'map' ? 1 : stagePages.length}
      data-pdf-selected-page={selectedStagePage ? selectedStagePage.pageIndex + 1 : ''}
    >
      {pages}
      <PdfWarningList warnings={warnings} />
    </main>
  );
}
