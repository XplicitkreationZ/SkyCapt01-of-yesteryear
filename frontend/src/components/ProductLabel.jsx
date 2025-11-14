import React from "react";

export const ProductLabel = ({ name, size }) => {
  const logo = "https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/gj0h0vr4_XplicitkreationZ_20250626_162911_0000.png";
  return (
    <div
      data-testid="product-label-overlay"
      className="absolute left-2 bottom-2 flex items-center gap-2 rounded-xl border border-emerald-400/70 bg-black/70 backdrop-blur-md px-2.5 py-1.5 shadow-[0_0_24px_rgba(16,185,129,0.25)]"
    >
      <img src={logo} alt="XZ Logo" className="h-6 w-6 rounded-full ring-1 ring-emerald-500/60" />
      <div className="leading-tight">
        <p className="text-xs text-white font-semibold">{name}</p>
        <p className="text-[10px] text-emerald-300">{size} • XplicitkreationZ</p>
      </div>
    </div>
  );
};
