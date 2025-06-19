import { NextResponse } from 'next/server';
import { getGameState, saveGameState } from '@/utils/gameState';

export async function POST(req: Request) {
  const body = await req.json();
  const { captain1Balance, captain2Balance } = body;

  const state = getGameState();
  state.captain1Balance = captain1Balance;
  state.captain2Balance = captain2Balance;
  saveGameState(state);

  return NextResponse.json({ message: 'Balances updated' });
}
