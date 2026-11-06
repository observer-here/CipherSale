"use client";

import type { ButtonHTMLAttributes } from "react";

export function Button({
  variant = "solid",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" | "text" }) {
  const kind = variant === "ghost" ? "btn btn-ghost" : variant === "text" ? "btn btn-text" : "btn";
  return <button className={`${kind} ${className}`} {...props} />;
}
