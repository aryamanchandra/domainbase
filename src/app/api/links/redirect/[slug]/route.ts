import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ShortLink } from '@/lib/models';

// Public endpoint for redirecting short links
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const db = await getDb();

    const link = await db
      .collection<ShortLink>('short_links')
      .findOne({ slug: params.slug, isActive: true });

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Increment click counter
    await db
      .collection<ShortLink>('short_links')
      .updateOne({ slug: params.slug }, { $inc: { clicks: 1 } });

    // Return redirect URL
    return NextResponse.json({
      targetUrl: link.targetUrl,
      clicks: link.clicks + 1,
    });
  } catch (error) {
    console.error('Error redirecting short link:', error);
    return NextResponse.json({ error: 'Failed to redirect' }, { status: 500 });
  }
}

