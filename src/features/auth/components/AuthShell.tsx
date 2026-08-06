import type { ReactNode } from "react";
import { Reveal } from "@/components/motion";
import { AuthBrandPanel } from "./AuthBrandPanel";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-page font-sans text-sa-primary">
      <AuthBrandPanel />
      <main className="flex min-h-dvh w-full flex-col items-center justify-center overflow-y-auto px-5 py-10 sm:px-12 sm:py-12 lg:w-1/2 lg:px-14 xl:px-20">
        <Reveal className="w-full max-w-[26rem] sm:max-w-[28rem]" fade>
          {children}
        </Reveal>
      </main>
    </div>
  );
}
