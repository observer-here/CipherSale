"use client";

import type { ButtonHTMLAttributes } from "react";

export function Button({
  variant = "solid",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" }) {
  const kind = variant === "ghost" ? "btn btn-ghost" : "btn";
  return <button className={`${kind} ${className}`} {...props} />;
}
