import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { TryonSession, ITryonSession } from '@/models/TryonSession';
import { isValidCode } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim() ?? '';

  if (!isValidCode(code)) {
    return NextResponse.json({ status: 'not_found' });
  }

  try {
    await connectDB();
    const session = await TryonSession.findOne({ session_code: code }).lean() as unknown as ITryonSession | null;

    if (!session) return NextResponse.json({ status: 'not_found' });

    // Check expiry
    if (new Date() > session.expires_at && session.status !== 'expired') {
      await TryonSession.updateOne({ session_code: code }, { status: 'expired' });
      return NextResponse.json({ status: 'expired' });
    }

    if (session.status === 'expired') return NextResponse.json({ status: 'expired' });

    if (session.status === 'done') {
      return NextResponse.json({
        status:    'done',
        image_url: session.result_image_url,
        expires_at: session.expires_at.toISOString(),
        person_image_url: session.person_image.url,
        cloth_image_url:  session.cloth_source.image_url,
      });
    }

    return NextResponse.json({
      status:    'processing',
      expires_at: session.expires_at.toISOString(),
      person_image_url: session.person_image.url,
      cloth_image_url:  session.cloth_source.image_url,
    });
  } catch (err) {
    console.error('[tryon/session]', err);
    return NextResponse.json({ status: 'not_found' });
  }
}
