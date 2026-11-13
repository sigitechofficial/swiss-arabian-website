import { SapilAuthFrame } from "./SapilAuthFrame";
import {
  SapilForgotPasswordForm,
  SapilLoginForm,
  SapilRegisterForm,
  SapilResetPasswordForm,
  SapilVerifyForm,
} from "./SapilAuthForms";

/* Sapil's sign-in pages (server): the auth frame around each client form. */

export function SapilLoginPage() {
  return (
    <SapilAuthFrame>
      <SapilLoginForm />
    </SapilAuthFrame>
  );
}

export function SapilRegisterPage() {
  return (
    <SapilAuthFrame>
      <SapilRegisterForm />
    </SapilAuthFrame>
  );
}

export function SapilVerifyPage() {
  return (
    <SapilAuthFrame>
      <SapilVerifyForm />
    </SapilAuthFrame>
  );
}

export function SapilForgotPasswordPage() {
  return (
    <SapilAuthFrame>
      <SapilForgotPasswordForm />
    </SapilAuthFrame>
  );
}

export function SapilResetPasswordPage() {
  return (
    <SapilAuthFrame>
      <SapilResetPasswordForm />
    </SapilAuthFrame>
  );
}
