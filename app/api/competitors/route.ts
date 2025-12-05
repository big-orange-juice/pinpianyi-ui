import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';

export async function GET() {
  try {
    const competitors = DataService.getCompetitors();
    return NextResponse.json(competitors);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch competitors' }, { status: 500 });
  }
}
