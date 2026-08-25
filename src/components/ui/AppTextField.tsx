"use client";

import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { radius } from "@/theme/designTokens";

export type AppTextFieldProps = TextFieldProps;

export function AppTextField(props: AppTextFieldProps) {
  return (
    <TextField
      fullWidth
      size="medium"
      {...props}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: `${radius.md}px`,
        },
        ...props.sx,
      }}
    />
  );
}
