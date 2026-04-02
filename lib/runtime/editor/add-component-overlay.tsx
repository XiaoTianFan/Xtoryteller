'use client';

import { startTransition, useDeferredValue, useMemo, useState } from 'react';

import { componentStarterRegistry, ComponentStarterDefinition } from '@/lib/runtime/editor/component-starters';

function groupByCategory(items: ComponentStarterDefinition[]) {
  const groups = new Map<string, ComponentStarterDefinition[]>();

  for (const item of items) {
    const bucket = groups.get(item.category) ?? [];
    bucket.push(item);
    groups.set(item.category, bucket);
  }

  return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
}

export function AddComponentOverlay({
  open,
  title,
  onClose,
  onAdd
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onAdd: (definition: ComponentStarterDefinition) => void;
}) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return componentStarterRegistry;
    }

    return componentStarterRegistry.filter((item) =>
      [item.displayName, item.type, item.category, item.description].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [deferredQuery]);
  const grouped = useMemo(() => groupByCategory(filtered), [filtered]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="shortcutOverlayBackdrop"
      onClick={onClose}
    >
      <div className="shortcutOverlayPanel addComponentOverlay appScrollbarMuted" onClick={(event) => event.stopPropagation()}>
        <div className="shortcutOverlayHeader">
          <div>
            <strong className="shortcutOverlayTitle">{title}</strong>
            <span className="shortcutOverlaySubtitle">
              Preview available components in the active theme, then insert one into the current editor.
            </span>
          </div>
          <button type="button" className="ghostButton" onClick={onClose}>
            Close
          </button>
        </div>
        <label className="addComponentSearch">
          <span className="srOnly">Search components</span>
          <input
            type="search"
            value={query}
            placeholder="Search components"
            className="dashboardInput"
            onChange={(event) => {
              const nextValue = event.currentTarget.value;
              startTransition(() => {
                setQuery(nextValue);
              });
            }}
          />
        </label>
        <div className="addComponentResults appScrollbarMuted">
          {grouped.map(([category, items]) => (
            <section key={category} className="addComponentSection">
              <div className="addComponentSectionHeader">
                <strong>{category.replace(/-/g, ' ')}</strong>
                <span className="shortcutOverlaySubtitle">{items.length} available</span>
              </div>
              <div className="addComponentGrid">
                {items.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    className="addComponentCard"
                    onClick={() => onAdd(item)}
                    aria-label={`Add ${item.displayName}`}
                  >
                    <div className="addComponentCardHeader">
                      <span className="clusterBadge">{item.type}</span>
                      <strong>{item.displayName}</strong>
                    </div>
                    <p className="addComponentCardDescription">{item.description}</p>
                    <div className="addComponentPreview">
                      <strong>{item.displayName}</strong>
                      <p className="addComponentCardDescription">
                        Insert a starter for <code>{item.type}</code> in the current theme.
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {grouped.length === 0 ? (
            <div className="missingPrimitive">
              <p>No components match that search yet.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
