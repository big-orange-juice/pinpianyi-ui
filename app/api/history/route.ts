import { NextResponse } from 'next/server';
import { getHistoryData } from '@/constants';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || 'TOP001';
    
    const historyData = getHistoryData(productId);
    return NextResponse.json(historyData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch history data' }, { status: 500 });
  }
}
