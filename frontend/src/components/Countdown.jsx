import React, { useEffect, useState } from "react";

const pad = (n) => String(n).padStart(2, "0");

export const Countdown = ({ targetISO }) => {
  const target = targetISO ? new Date(targetISO).getTime() : Date.now() + 1000 * 60 * 60 * 24 * 14; // default 14 days
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return (
    <div className="mt-8 flex items-center gap-3" data-testid="countdown">
      {[
        { label: "Days", value: days },
        { label: "Hours", value: hours },
        { label: "Minutes", value: minutes },
        { label: "Seconds", value: seconds },
      ].map((u) => (
        <div key={u.label} className="rounded-xl border border-emerald-500/30 bg-zinc-900/60 px-4 py-3 text-center min-w-[86px]">
          <div className="text-2xl font-bold text-white" data-testid={`countdown-${u.label.toLowerCase()}`}>{pad(u.value)}</div>
          <div className="text-[11px] tracking-wide text-emerald-300">{u.label}</div>
        </div>
      ))}
    </div>
  );
};
