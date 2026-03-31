function lookupPath(source: Record<string, unknown>, pathExpression: string): unknown {
  return pathExpression.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

export function applyTemplateExpressions(input: unknown, data: Record<string, unknown>): unknown {
  if (typeof input === 'string') {
    return input.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, expression) => {
      const resolved = lookupPath(data, expression);
      return resolved == null ? '' : String(resolved);
    });
  }

  if (Array.isArray(input)) {
    return input.map((item) => applyTemplateExpressions(item, data));
  }

  if (input && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).map(([key, value]) => [key, applyTemplateExpressions(value, data)])
    );
  }

  return input;
}
