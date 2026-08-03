const startedAtMs = Date.now();

function env(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

export function getUptimeSeconds(): number {
  return Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
}

export function getDeploymentMeta() {
  const commitSha = env("GIT_COMMIT_SHA", env("GITHUB_SHA"));
  const shortCommitSha =
    env("GIT_SHORT_SHA") ||
    (commitSha.length >= 7 ? commitSha.slice(0, 7) : commitSha);
  const imageTag = env("IMAGE_TAG");
  const fullImage = env("FULL_IMAGE");
  const buildTime = env("BUILD_TIME");
  const workflowRunUrl = env("GITHUB_RUN_URL");
  const branch = env("GIT_BRANCH", env("GITHUB_REF_NAME", "unknown"));
  const nodeEnv = env("NODE_ENV", "production");
  const appEnv = env("NEXT_PUBLIC_APP_ENV", "dev");

  return {
    commitSha,
    shortCommitSha,
    imageTag,
    fullImage,
    buildTime,
    workflowRunUrl,
    branch,
    nodeEnv,
    appEnv,
  };
}
