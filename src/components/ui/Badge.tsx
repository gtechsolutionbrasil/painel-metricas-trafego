import type { ReactNode } from "react";

type Variant = "brand" | "neutral" | "warning" | "danger";

const CLASS: Record<Variant, string> = {
  brand: "badge",
  neutral: "badge badge-neutral",
  warning: "badge badge-warning",
  danger: "badge badge-danger",
};

export function Badge({
  children,
  variant = "brand",
  dot = false,
}: {
  children: ReactNode;
  variant?: Variant;
  dot?: boolean;
}) {
  return (
    <span className={CLASS[variant]}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}
