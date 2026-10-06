import { NextResponse } from "next/server";
import { getDeploymentMeta, getUptimeSeconds } from "@/lib/config/deploymentMeta";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    ...getDeploymentMeta(),
    uptimeSeconds: getUptimeSeconds(),
  });
}
