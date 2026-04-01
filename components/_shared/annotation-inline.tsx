'use client';

import { ReactNode, useId, useMemo, useState } from 'react';

import styles from './annotation-inline.module.css';

export function AnnotationInline({ children, detail }: { children: ReactNode; detail: string }) {
  const id = useId();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const visible = hovered || focused || pinned;
  const describedBy = useMemo(() => (visible ? id : undefined), [id, visible]);

  return (
    <span className={styles.root} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={visible}
        aria-describedby={describedBy}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setPinned(false);
        }}
        onClick={() => setPinned((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            setPinned(false);
          }
        }}
      >
        {children}
      </button>
      {visible ? (
        <span id={id} role="tooltip" className={styles.popover}>
          {detail}
        </span>
      ) : null}
    </span>
  );
}
