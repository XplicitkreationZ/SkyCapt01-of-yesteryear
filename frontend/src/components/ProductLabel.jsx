import React from "react";
import QRCode from "react-qr-code";

export const ProductLabel = ({ name, size }) => {
  const logo = "https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/gj0h0vr4_XplicitkreationZ_20250626_162911_0000.png";
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://www.xplicitkreationz.com';
  const qrUrl = `${base}/?p=${encodeURIComponent(name)}-${encodeURIComponent(size)}`;
  return (
    <div
      data-testid="product-label-overlay"
      className="absolute left-2 bottom-2 flex items-center gap-2 rounded-xl border border-emerald-400/70 bg-black/70 backdrop-blur-md px-2.5 py-1.5 shadow-[0_0_24px_rgba(16,185,129,0.25)]"
    >
      <img src={logo} alt="XZ Logo" className="h-6 w-6 rounded-full ring-1 ring-emerald-500/60" />
      <div className="leading-tight pr-2">
        <p className="text-xs text-white font-semibold">{name}</p>
        <p className="text-[10px] text-emerald-300">{size} • XplicitkreationZ</p>
      </div>
      <div className="h-7 w-7 rounded-md bg-white p-[1px]">
        <QRCode value={qrUrl} bgColor="#ffffff" fgColor="#111111" size={24} viewBox={`0 0 24 24`} />
      </div>
    </div>
  );
};
