"use client";

// Fixed status line. Call toast() from anywhere; Toaster is mounted once in the shell.
import { useEffect, useState } from "react";

type Item = { id: number; text: string; bad: boolean };

let emit: ((text: string, bad: boolean) => void) | null = null;

export function toast(text: string, bad = true) {
  emit?.(text, bad);
}

export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const timers = new Map<number, number>();
    emit = (text, bad) => {
      const id = Date.now();
      setItems((list) => {
        for (const old of list) {
          if (old.text !== text) continue;
          const timer = timers.get(old.id);
          if (timer) window.clearTimeout(timer);
          timers.delete(old.id);
        }
        return [...list.filter((item) => item.text !== text), { id, text, bad }];
      });
      timers.set(id, window.setTimeout(() => {
        timers.delete(id);
        setItems((list) => list.filter((item) => item.id !== id));
      }, 3200));
    };
    return () => {
      emit = null;
      for (const timer of timers.values()) window.clearTimeout(timer);
    };
  }, []);

  if (!items.length) return null;
  return (
    <div className="toasts" role="status">
      {items.map((item) => <p key={item.id} className={item.bad ? "toast bad" : "toast"}>{item.text}</p>)}
    </div>
  );
}
