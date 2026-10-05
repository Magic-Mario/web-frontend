import { NextResponse } from "next/server";

import { createMovement, listMovements, type MovementType } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await listMovements());
  } catch {
    return NextResponse.json(
      { error: "backend_unavailable" },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    type: MovementType;
    amount_cents: number;
    description?: string;
  };

  try {
    const movement = await createMovement({
      type: payload.type,
      amount_cents: payload.amount_cents,
      description: payload.description ?? "",
    });
    return NextResponse.json(movement, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "backend_unavailable" },
      { status: 502 },
    );
  }
}
