import { NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';

export async function GET() {
  try {
    const products = DataService.getInternalProducts();
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
