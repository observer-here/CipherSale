"use client";

import type { ButtonHTMLAttributes } from "react";

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`border-b border-[#9ff6ff] pb-0.5 text-[#9ff6ff] disabled:cursor-default disabled:opacity-40 ${className}`}
      {...props}
    />
  );
}
