'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { usePresentationRuntime } from '@/lib/runtime/providers/presentation-provider';

function ViewerHotkeys() {
  const router = useRouter();
  const { presentation, machine } = usePresentationRuntime();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
        event.preventDefault();
        machine.next();
      }

      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        machine.prev();
      }

      if (event.key === 'Escape') {
        if (presentation.mode === 'stage' && machine.state.context.currentStepIndex === 0 && machine.state.context.currentBuildIndex === 0) {
          router.push('/');
        }
        if (presentation.mode === 'map' && machine.state.context.currentClusterId === presentation.clusters?.[0]?.id) {
          router.push('/');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [machine, presentation, router]);

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
  const progress = total > 0 ? (current / total) * 100 : 0;
  const unitLabel = mapMode ? 'Cluster' : 'Step';

  return (
    <>
      <ViewerHotkeys />
      <div className="viewerHud">
        <button type="button" className="viewerDockTrigger" aria-label="Show presentation controls" />
        <div className="viewerDock">
          <div className="viewerDockPanelShell">
            <div className="viewerDockPanel">
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
                </div>
                {rightActions ? <div className="viewerDockActions">{rightActions}</div> : null}
              </div>
            </div>
          </div>
          <div className="viewerRail" aria-label="Presentation progress">
            <div className="progressWrap">
              <div className="progressBar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
