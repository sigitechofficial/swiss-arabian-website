import { NextResponse } from "next/server";
import {
  getDeploymentMeta,
  getUptimeSeconds,
} from "@/lib/config/deploymentMeta";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const meta = getDeploymentMeta();
  const environment = meta.appEnv || "dev";

  return NextResponse.json({
    status: "ok",
    service: "swiss-arabian-website",
    environment,
    branch: meta.branch,
    deployment: {
      commitSha: meta.commitSha,
      shortCommitSha: meta.shortCommitSha,
      imageTag: meta.imageTag,
      fullImage: meta.fullImage,
      buildTime: meta.buildTime,
      workflowRunUrl: meta.workflowRunUrl,
    },
    runtime: {
      nodeEnv: meta.nodeEnv,
      appEnv: environment,
      uptimeSeconds: getUptimeSeconds(),
    },
  });
}
