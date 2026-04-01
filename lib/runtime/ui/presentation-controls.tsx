'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return Boolean(target.closest('input, textarea, select, button, a, [role="button"], [contenteditable="true"]'));
}

function ShortcutOverlay({
  open,
  mapMode,
  onClose
}: {
  open: boolean;
  mapMode: boolean;
  onClose: () => void;
}) {
  const sections = useMemo(
    () =>
      mapMode
        ? [
            {
              title: 'Map',
              shortcuts: [
                ['Arrow keys', 'Pan in free roam or move along the guided sequence'],
                ['Space / PageDown', 'Advance guided mode'],
                ['PageUp', 'Go back in guided mode'],
                ['+ / - / 0', 'Zoom in, zoom out, or reset the overview'],
                ['G', 'Toggle guided mode'],
                ['1-9', 'Jump to a cluster in the current sequence'],
                ['Esc', 'Exit guided mode, then return to the dashboard'],
                ['?', 'Toggle this help panel']
              ]
            }
          ]
        : [
            {
              title: 'Stage',
              shortcuts: [
                ['Arrow keys / Space / PageDown', 'Advance the current build or next step'],
                ['PageUp', 'Go back one build or step'],
                ['Home / End', 'Jump to the first or last step'],
                ['0-9', 'Jump directly to a step number'],
                ['F', 'Toggle fullscreen'],
                ['Esc', 'Return to step 1, then back to the dashboard'],
                ['?', 'Toggle this help panel']
              ]
            }
          ],
    [mapMode]
  );

  if (!open) {
    return null;
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onClick={onClose} className="shortcutOverlayBackdrop">
      <div onClick={(event) => event.stopPropagation()} className="shortcutOverlayPanel appScrollbarMuted">
        <div className="shortcutOverlayHeader">
          <div>
            <strong className="shortcutOverlayTitle">Keyboard shortcuts</strong>
            <span className="shortcutOverlaySubtitle">
              {mapMode ? 'Map navigation, camera, and guided mode shortcuts.' : 'Stage navigation and viewer shortcuts.'}
            </span>
          </div>
          <button type="button" className="ghostButton" onClick={onClose}>
            Close
          </button>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="shortcutOverlaySection">
            <strong>{section.title}</strong>
            {section.shortcuts.map(([keys, description]) => (
              <div key={`${section.title}-${keys}`} className="shortcutOverlayRow">
                <code className="shortcutOverlayKey">{keys}</code>
                <span className="shortcutOverlayDescription">{description}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ViewerHotkeys({
  total,
  current,
  mapMode,
  onToggleShortcuts
}: {
  total: number;
  current: number;
  mapMode: boolean;
  onToggleShortcuts: () => void;
}) {
  const router = useRouter();
  const { presentation, machine } = usePresentationRuntime();
  const digitBufferRef = useRef('');
  const digitTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const clearDigitBuffer = () => {
      digitBufferRef.current = '';
      if (digitTimeoutRef.current !== null) {
        window.clearTimeout(digitTimeoutRef.current);
        digitTimeoutRef.current = null;
      }
    };

    const pushDigit = (digit: string) => {
      digitBufferRef.current = `${digitBufferRef.current}${digit}`.slice(-3);
      if (digitTimeoutRef.current !== null) {
        window.clearTimeout(digitTimeoutRef.current);
      }
      digitTimeoutRef.current = window.setTimeout(clearDigitBuffer, 900);
      return Number(digitBufferRef.current);
    };

    const toggleFullscreen = async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          return;
        }

        await document.documentElement.requestFullscreen?.();
      } catch {
        // Ignore fullscreen failures caused by platform or browser restrictions.
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
        event.preventDefault();
        onToggleShortcuts();
        return;
      }

      if (mapMode) {
        const clusterIds = machine.state.context.guided
          ? presentation.navigation?.sequence ?? presentation.clusters?.map((cluster) => cluster.id) ?? []
          : presentation.clusters?.map((cluster) => cluster.id) ?? [];

        if (/^[1-9]$/.test(event.key)) {
          event.preventDefault();
          const requestedIndex = pushDigit(event.key);
          const clusterId = clusterIds[Math.min(clusterIds.length - 1, requestedIndex - 1)];
          if (clusterId) {
            machine.goToCluster(clusterId);
          }
          return;
        }

        switch (event.key) {
          case 'g':
          case 'G':
            event.preventDefault();
            if (machine.state.context.guided) {
              machine.exitGuided();
            } else {
              machine.enterGuided();
            }
            return;
          case 'ArrowRight':
            event.preventDefault();
            if (machine.state.context.guided) {
              machine.next();
            } else {
              machine.pan(-90, 0);
            }
            return;
          case 'ArrowLeft':
            event.preventDefault();
            if (machine.state.context.guided) {
              machine.prev();
            } else {
              machine.pan(90, 0);
            }
            return;
          case 'ArrowUp':
            event.preventDefault();
            if (machine.state.context.guided) {
              machine.prev();
            } else {
              machine.pan(0, 90);
            }
            return;
          case 'ArrowDown':
            event.preventDefault();
            if (machine.state.context.guided) {
              machine.next();
            } else {
              machine.pan(0, -90);
            }
            return;
          case ' ':
          case 'PageDown':
            if (machine.state.context.guided) {
              event.preventDefault();
              machine.next();
            }
            return;
          case 'PageUp':
            if (machine.state.context.guided) {
              event.preventDefault();
              machine.prev();
            }
            return;
          case '+':
          case '=':
            event.preventDefault();
            machine.zoom(machine.state.context.camera.zoom + 0.12);
            return;
          case '-':
          case '_':
            event.preventDefault();
            machine.zoom(machine.state.context.camera.zoom - 0.12);
            return;
          case '0':
            event.preventDefault();
            machine.send({ type: 'SET_CAMERA', camera: machine.cameraFrame });
            clearDigitBuffer();
            return;
          case 'Escape':
            event.preventDefault();
            clearDigitBuffer();
            if (machine.state.context.guided) {
              machine.exitGuided();
            } else {
              router.push('/');
            }
            return;
          default:
            return;
        }
      }

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        const requestedStep = pushDigit(event.key);
        const zeroBasedIndex = requestedStep === 0 ? 0 : requestedStep - 1;
        if (zeroBasedIndex >= 0 && zeroBasedIndex < total) {
          machine.goToStep(zeroBasedIndex);
        }
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
          event.preventDefault();
          machine.next();
          return;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          event.preventDefault();
          machine.prev();
          return;
        case 'Home':
          event.preventDefault();
          clearDigitBuffer();
          machine.goToStep(0);
          return;
        case 'End':
          event.preventDefault();
          clearDigitBuffer();
          machine.goToStep(Math.max(0, total - 1));
          return;
        case 'f':
        case 'F':
          event.preventDefault();
          void toggleFullscreen();
          return;
        case 'Escape':
          event.preventDefault();
          clearDigitBuffer();
          if (current > 1 || machine.state.context.currentBuildIndex > 0) {
            machine.goToStep(0);
          } else {
            router.push('/');
          }
          return;
        default:
          return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearDigitBuffer();
    };
  }, [current, machine, mapMode, onToggleShortcuts, presentation, router, total]);

  return null;
}

export function PresentationControls({
  total,
  current,
  mapMode,
  sequence,
  rightActions
}: {
  total: number;
  current: number;
  mapMode?: boolean;
  sequence?: ReactNode;
  rightActions?: ReactNode;
}) {
  const { machine } = usePresentationRuntime();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const progress = total > 0 ? (current / total) * 100 : 0;
  const unitLabel = mapMode ? 'Cluster' : 'Step';

  return (
    <>
      <ViewerHotkeys
        total={total}
        current={current}
        mapMode={Boolean(mapMode)}
        onToggleShortcuts={() => setShowShortcuts((value) => !value)}
      />
      <ShortcutOverlay open={showShortcuts} mapMode={Boolean(mapMode)} onClose={() => setShowShortcuts(false)} />
      <div className="viewerHud">
        <button type="button" className="viewerDockTrigger" aria-label="Show presentation controls" />
        <div className="viewerDock">
          <div className="viewerDockPanelShell">
            <div className="viewerDockPanel appScrollbarMuted">
              {sequence ? sequence : null}
              <div className="viewerDockRow">
                <div className="viewerDockPrimary">
                  <button type="button" className="ghostButton" onClick={machine.prev}>
                    Previous
                  </button>
                  <span className="progressMeta">
                    {unitLabel} {Math.max(current, 1)} / {total}
                  </span>
                  <button type="button" className="ghostButton" onClick={machine.next}>
                    Next
                  </button>
                  <button
                    type="button"
                    className="ghostButton"
                    onClick={() => setShowShortcuts((value) => !value)}
                    aria-expanded={showShortcuts}
                    aria-haspopup="dialog"
                  >
                    Shortcuts
                  </button>
                </div>
                {rightActions ? <div className="viewerDockActions">{rightActions}</div> : null}
              </div>
            </div>
          </div>
          <div
            className="viewerRail"
            role="progressbar"
            aria-label="Presentation progress"
            aria-valuemin={1}
            aria-valuemax={Math.max(total, 1)}
            aria-valuenow={Math.max(current, 1)}
          >
            <div className="progressWrap">
              <div className="progressBar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
