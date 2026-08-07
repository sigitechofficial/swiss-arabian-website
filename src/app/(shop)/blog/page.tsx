import { Suspense } from "react";
import { PageLoading } from "@/components/ui";
import { BlogPageView } from "@/features/blog";

export default function BlogPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading journal…" fill />}>
      <BlogPageView />
    </Suspense>
  );
}
