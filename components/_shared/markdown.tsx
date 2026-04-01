import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { AnnotationInline } from '@/components/_shared/annotation-inline';
import { normalizeAnnotationKey, useAnnotations } from '@/components/_shared/annotation-context';
import { annotationRemarkPlugin, parseAnnotationHref } from '@/components/_shared/markdown-annotations';

export function Markdown({ content }: { content: string }) {
  const annotations = useAnnotations();

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, annotationRemarkPlugin]}
      components={{
        a({ href, children }) {
          const annotation = parseAnnotationHref(href);
          if (!annotation) {
            return (
              <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noreferrer' : undefined}>
                {children}
              </a>
            );
          }

          const detail = annotations[annotation.key] ?? annotations[normalizeAnnotationKey(annotation.key)] ?? annotations[annotation.label];
          if (!detail) {
            return <>{children}</>;
          }

          return <AnnotationInline detail={detail}>{children}</AnnotationInline>;
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
