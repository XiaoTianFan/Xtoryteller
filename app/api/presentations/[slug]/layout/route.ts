import { NextResponse } from 'next/server';

import {
  ClusterLayoutGeometry,
  SavedMapClusterLayoutDraft,
  PresentationLayoutSavePayload,
  PresentationLayoutSaveError,
  SavedStageComponentLayoutDraft,
  StageComponentLayoutGeometry,
  savePresentationLayoutBySlug
} from '@/lib/engine/presentation-layout-save';

function readLayoutPayload(payload: unknown): PresentationLayoutSavePayload {
  const clusters = (payload as { clusters?: Array<ClusterLayoutGeometry | SavedMapClusterLayoutDraft> } | null)?.clusters;
  if (!Array.isArray(clusters)) {
    const stepIndex = (payload as { stepIndex?: number } | null)?.stepIndex;
    const components = (payload as { components?: Array<StageComponentLayoutGeometry | SavedStageComponentLayoutDraft> } | null)?.components;
    if (Number.isInteger(stepIndex) && Array.isArray(components)) {
      return {
        stepIndex: Number(stepIndex),
        components
      };
    }

    throw new PresentationLayoutSaveError(400, 'Request body must include either clusters or stepIndex/components layout data.');
  }

  return { clusters };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const payload = await request.json().catch(() => null);
    const layoutPayload = readLayoutPayload(payload);
    const { slug } = await params;
    const result = await savePresentationLayoutBySlug(slug, layoutPayload);

    if ('clusterCount' in result) {
      return NextResponse.json({
        updatedAt: result.updatedAt,
        clusterCount: result.clusterCount
      });
    }

    return NextResponse.json({
      updatedAt: result.updatedAt,
      stepIndex: result.stepIndex,
      componentCount: result.componentCount
    });
  } catch (error) {
    if (error instanceof PresentationLayoutSaveError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Failed to save presentation layout.' }, { status: 500 });
  }
}
