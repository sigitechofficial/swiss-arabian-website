"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/Toaster";
import { apiPost } from "@/lib/api/apiClient";
import { setTokens } from "@/lib/auth/token";
import { useAuthStore } from "@/stores/useAuthStore";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { loginSchema, type LoginFormValues } from "../schemas/loginSchema";
import { AuthCard } from "./AuthCard";
import { AuthCheckbox } from "./AuthCheckbox";
import { AuthField } from "./AuthField";
import { AuthPasswordField } from "./AuthPasswordField";
import { AuthSubmitButton } from "./AuthSubmitButton";

export function LoginPageView() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  });

  return (
    <AuthCard
      subtitle="Welcome back to Swiss Arabian."
      title="Sign in"
    >
      <form
        className="flex w-full flex-col gap-5"
        onSubmit={handleSubmit(async (values) => {
          try {
            const data = await apiPost<{
              accessToken: string;
              refreshToken?: string;
              user: {
                id: string;
                email: string;
                firstName?: string;
                lastName?: string;
              };
            }>(
              "/store/auth/login",
              { email: values.email, password: values.password },
              { skipAuth: true },
            );
            setTokens(data.accessToken, data.refreshToken);
            setUser(data.user);
            toast("Welcome back", "success");
            router.push("/account");
          } catch (error) {
            toast(getUserFacingErrorMessage(error), "error");
          }
        })}
      >
        <div className="flex w-full flex-col gap-4">
          <AuthField
            label="Email or phone"
            placeholder="you@email.com"
            autoComplete="username"
            {...register("email")}
            error={errors.email?.message}
          />
          <AuthPasswordField
            placeholder="Enter your password"
            forgotHref="/forgot-password"
            {...register("password")}
            error={errors.password?.message}
          />
        </div>

        <AuthCheckbox label="Keep me signed in" {...register("remember")} />

        <AuthSubmitButton disabled={isSubmitting}>Sign in</AuthSubmitButton>

        <p className="flex flex-wrap items-center justify-center gap-1 text-center text-[13px]">
          <span className="text-sa-secondary">New to Swiss Arabian?</span>
          <Link
            href="/register"
            className="font-semibold text-[var(--sa-action-primary)] hover:text-[var(--sa-action-primary-hover)]"
          >
            Create an account
          </Link>
        </p>

        <div className="h-px w-full bg-sa-border" aria-hidden />
      </form>
    </AuthCard>
  );
}
