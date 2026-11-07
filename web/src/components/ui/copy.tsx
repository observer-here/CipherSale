"use client";

import { useState } from "react";

export function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setDone(true);
      setTimeout(() => setDone(false), 1200);
    });
  }
  return <button type="button" className="eye" onClick={copy}>{done ? "Copied" : "Copy"}</button>;
}
