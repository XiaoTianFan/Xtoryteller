import { CSSProperties } from 'react';
import { motion } from 'framer-motion';

import { AnnotationProvider } from '@/components/_shared/annotation-context';
import { resolveRuntimeComponent, resolveRuntimeTransition } from '@/lib/runtime/primitive-resolver';
import { ComponentInstance } from '@/lib/types/presentation';

export function ComponentRenderer({
  component,
  revealCount,
  slug
}: {
  component: ComponentInstance;
  revealCount: number;
  slug: string;
}) {
  const Selected = resolveRuntimeComponent(slug, component.type);

  if (!Selected) {
    return (
      <article className="missingPrimitive">
        <p>Unknown component: {component.type}</p>
      </article>
    );
  }

  const enterPreset = component.enter ? resolveRuntimeTransition(slug, component.enter) : null;
  const exitPreset = component.exit ? resolveRuntimeTransition(slug, component.exit) : enterPreset;
  const contentNode = (
    <Selected
      content={component.content}
      props={component.props}
      style={component.style as CSSProperties | undefined}
      revealCount={revealCount}
      slug={slug}
    />
  );

  return (
    <AnnotationProvider annotations={component.annotations}>
      {enterPreset || exitPreset ? (
        <motion.div
          initial={enterPreset?.enter}
          animate={enterPreset?.center ?? exitPreset?.center}
          exit={exitPreset?.exit}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {contentNode}
        </motion.div>
      ) : (
        contentNode
      )}
    </AnnotationProvider>
  );
}
