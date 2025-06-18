import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { Subdomain } from '@/lib/models';
import { verifyToken } from '@/lib/auth';

// GET all subdomains for authenticated user
export async function GET(request: NextRequest) {
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
    const subdomains = await db
      .collection<Subdomain>('subdomains')
      .find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ subdomains });
  } catch (error) {
    console.error('Error fetching subdomains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subdomains' },
      { status: 500 }
    );
  }
}

// POST create new subdomain
export async function POST(request: NextRequest) {
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
    const { subdomain, title, description, content, customCss, metadata } = body;

    if (!subdomain || !title) {
      return NextResponse.json(
        { error: 'Subdomain and title are required' },
        { status: 400 }
      );
    }

    // Validate subdomain format (alphanumeric and hyphens only)
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json(
        { error: 'Subdomain must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if subdomain already exists
    const existing = await db.collection('subdomains').findOne({ subdomain });
    if (existing) {
      return NextResponse.json(
        { error: 'Subdomain already exists' },
        { status: 409 }
      );
    }

    const newSubdomain: Subdomain = {
      subdomain,
      title,
      description: description || '',
      content: content || '',
      customCss: customCss || '',
      userId: decoded.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      metadata: metadata || {},
    };

    const result = await db.collection('subdomains').insertOne(newSubdomain);

    return NextResponse.json({
      success: true,
      subdomain: { ...newSubdomain, _id: result.insertedId },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating subdomain:', error);
    return NextResponse.json(
      { error: 'Failed to create subdomain' },
      { status: 500 }
    );
  }
}

