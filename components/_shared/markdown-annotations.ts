export interface MarkdownNode {
  type: string;
  value?: string;
  url?: string;
  title?: string;
  children?: MarkdownNode[];
}

export const ANNOTATION_PROTOCOL = 'xt-annotation:';
export const annotationPattern = /\{\{hover:([^}]+)\}\}/g;

export function createAnnotationLink(rawValue: string): MarkdownNode {
  const [rawKey, rawLabel] = rawValue.split('|').map((part) => part.trim());
  const key = rawKey || rawLabel;
  const label = rawLabel || rawKey;

  return {
    type: 'link',
    url: `${ANNOTATION_PROTOCOL}${encodeURIComponent(key)}|${encodeURIComponent(label)}`,
    children: [{ type: 'text', value: label }]
  };
}

export function splitTextNode(value: string): MarkdownNode[] {
  const nodes: MarkdownNode[] = [];
  let cursor = 0;

  for (const match of value.matchAll(annotationPattern)) {
    const full = match[0];
    const target = match[1]?.trim();
    const index = match.index ?? 0;

    if (index > cursor) {
      nodes.push({ type: 'text', value: value.slice(cursor, index) });
    }

    if (target) {
      nodes.push(createAnnotationLink(target));
    } else {
      nodes.push({ type: 'text', value: full });
    }

    cursor = index + full.length;
  }

  if (cursor < value.length) {
    nodes.push({ type: 'text', value: value.slice(cursor) });
  }

  return nodes.length ? nodes : [{ type: 'text', value }];
}

export function transformAnnotationTokens(node: MarkdownNode): void {
  if (!Array.isArray(node.children)) {
    return;
  }

  const nextChildren: MarkdownNode[] = [];
  for (const child of node.children) {
    if (child.type === 'text' && typeof child.value === 'string' && annotationPattern.test(child.value)) {
      annotationPattern.lastIndex = 0;
      nextChildren.push(...splitTextNode(child.value));
      continue;
    }

    transformAnnotationTokens(child);
    nextChildren.push(child);
  }

  node.children = nextChildren;
}

export function annotationRemarkPlugin() {
  return (tree: MarkdownNode) => {
    transformAnnotationTokens(tree);
  };
}

export function parseAnnotationHref(href?: string) {
  if (!href?.startsWith(ANNOTATION_PROTOCOL)) {
    return null;
  }

  const encoded = href.slice(ANNOTATION_PROTOCOL.length);
  const [rawKey = '', rawLabel = rawKey] = encoded.split('|');
  return {
    key: decodeURIComponent(rawKey),
    label: decodeURIComponent(rawLabel)
  };
}
