import { getUserFacingErrorMessage } from "./userFacingErrors";
import { toast } from "@/components/ui/Toaster";

export function toastApiError(error: unknown) {
  toast(getUserFacingErrorMessage(error), "error");
}
