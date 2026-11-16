import { NextResponse } from "next/server";
import { appEnv } from "@/lib/config/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const environment = appEnv();

  return NextResponse.json({
    status: "ok",
    service: "swiss-arabian-v2",
    brand: process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE ?? null,
    environment,
  });
}
