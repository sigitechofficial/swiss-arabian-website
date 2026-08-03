import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const environment = (process.env.NEXT_PUBLIC_APP_ENV ?? "dev").trim() || "dev";

  return NextResponse.json({
    status: "ok",
    service: "swiss-arabian-website",
    environment,
  });
}
