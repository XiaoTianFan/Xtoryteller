import { NextResponse } from 'next/server';

import {
  ClusterLayoutGeometry,
  PresentationLayoutSaveError,
  savePresentationLayoutBySlug
} from '@/lib/engine/presentation-layout-save';

function readClusterGeometry(payload: unknown): ClusterLayoutGeometry[] {
  const clusters = (payload as { clusters?: ClusterLayoutGeometry[] } | null)?.clusters;
  if (!Array.isArray(clusters)) {
    throw new PresentationLayoutSaveError(400, 'Request body must include a clusters array.');
  }

  return clusters;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const payload = await request.json().catch(() => null);
    const clusters = readClusterGeometry(payload);
    const { slug } = await params;
    const result = await savePresentationLayoutBySlug(slug, clusters);

    return NextResponse.json({
      updatedAt: result.updatedAt,
      clusterCount: result.clusterCount
    });
  } catch (error) {
    if (error instanceof PresentationLayoutSaveError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Failed to save presentation layout.' }, { status: 500 });
  }
}
