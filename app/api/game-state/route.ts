import { NextResponse } from 'next/server';
import { getGameState } from '@/utils/gameState';

export function GET() {
  const state = getGameState();
  return NextResponse.json(state);
}
