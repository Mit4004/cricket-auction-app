import { NextResponse } from 'next/server';
import { getGameState, saveGameState } from '@/utils/gameState';

export async function POST(req: Request) {
  const body = await req.json();
  const { name, role } = body;

  if (!name || !role) {
    return NextResponse.json({ error: 'Missing name or role' }, { status: 400 });
  }

  const state = getGameState();
  const newPlayer = { id: Date.now(), name, role };
  state.players.push(newPlayer);
  saveGameState(state);

  return NextResponse.json({ message: 'Player added', player: newPlayer });
}
