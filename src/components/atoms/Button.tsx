import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "success";
type ButtonSize = "xs" | "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const sizeClass: Record<ButtonSize, string> = {
  xs: "btn-xs",
  sm: "btn-sm",
  md: "",
};

export function Button({
  variant,
  size = "md",
  children,
  className,
  ...props
}: ButtonProps) {
  const classes = [
    "btn",
    `btn-${variant}`,
    sizeClass[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
