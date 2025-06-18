import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { Subdomain } from '@/lib/models';
import { verifyToken } from '@/lib/auth';

// GET specific subdomain
export async function GET(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const db = await getDb();
    const subdomain = await db
      .collection<Subdomain>('subdomains')
      .findOne({ subdomain: params.subdomain });

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ subdomain });
  } catch (error) {
    console.error('Error fetching subdomain:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subdomain' },
      { status: 500 }
    );
  }
}

// PUT update subdomain
export async function PUT(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    // Check authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, content, customCss, isActive, metadata } = body;

    const db = await getDb();
    
    const updateData: Partial<Subdomain> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    if (customCss !== undefined) updateData.customCss = customCss;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (metadata !== undefined) updateData.metadata = metadata;

    const result = await db.collection('subdomains').findOneAndUpdate(
      { subdomain: params.subdomain, userId: decoded.userId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Subdomain not found or you do not have permission to update it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subdomain: result,
    });
  } catch (error) {
    console.error('Error updating subdomain:', error);
    return NextResponse.json(
      { error: 'Failed to update subdomain' },
      { status: 500 }
    );
  }
}

// DELETE subdomain
export async function DELETE(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    // Check authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const db = await getDb();
    const result = await db
      .collection('subdomains')
      .deleteOne({ subdomain: params.subdomain, userId: decoded.userId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Subdomain not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subdomain deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting subdomain:', error);
    return NextResponse.json(
      { error: 'Failed to delete subdomain' },
      { status: 500 }
    );
  }
}

