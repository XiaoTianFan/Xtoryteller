'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
  mapMode
}: {
  total: number;
  current: number;
  mapMode?: boolean;
}) {
  const { machine } = usePresentationRuntime();
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <>
      <ViewerHotkeys />
      <div className="viewerHud">
        <div className="progressWrap" aria-label="Presentation progress">
          <div className="progressBar" style={{ width: `${progress}%` }} />
        </div>
        <div className="controlRow">
          <button type="button" className="ghostButton" onClick={machine.prev}>
            Previous
          </button>
          <span className="progressMeta">
            {mapMode ? 'Cluster' : 'Step'} {Math.max(current, 1)} / {total}
          </span>
          <button type="button" className="ghostButton" onClick={machine.next}>
            Next
          </button>
        </div>
      </div>
    </>
  );
}
