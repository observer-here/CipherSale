"use client";

import { useEffect, useState } from "react";

type Item = { id: number; text: string };

let items: Item[] = [];
let next = 1;
const listeners = new Set<() => void>();

function publish() {
  for (const hear of listeners) hear();
}

function dismiss(id: number) {
  if (!items.some((item) => item.id === id)) return;
  items = items.filter((item) => item.id !== id);
  publish();
}

export function toast(text: string) {
  const id = next++;
  items = [...items.filter((item) => item.text !== text).slice(-2), { id, text }];
  publish();
  window.setTimeout(() => dismiss(id), 4500);
}

export function Toasts() {
  const [list, setList] = useState<Item[]>([]);
  useEffect(() => {
    const hear = () => setList(items.slice());
    listeners.add(hear);
    hear();
    return () => { listeners.delete(hear); };
  }, []);
  if (!list.length) return null;
  return (
    <div className="toasts">
      {list.map((item) => (
        <button key={item.id} type="button" className="toast" onClick={() => dismiss(item.id)}>{item.text}</button>
      ))}
    </div>
  );
}
