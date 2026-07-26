import { NextRequest, NextResponse } from 'next/server';
import { getSimulationMode, setSimulationMode, SimulationMode } from '@/lib/payment';

export async function GET() {
  return NextResponse.json({ mode: getSimulationMode() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode } = body as { mode: SimulationMode };

    if (mode !== 'always_success' && mode !== 'force_failure') {
      return NextResponse.json(
        { success: false, error: 'Invalid mode. Must be always_success or force_failure.' },
        { status: 400 }
      );
    }

    const updatedMode = setSimulationMode(mode);
    return NextResponse.json({ success: true, mode: updatedMode });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
