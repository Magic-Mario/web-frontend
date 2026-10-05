import { NextResponse } from "next/server";

import { getBalance } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getBalance());
  } catch {
    // Fallo controlado: el backend caído no tumba el frontend.
    return NextResponse.json(
      { error: "backend_unavailable" },
      { status: 502 },
    );
  }
}
