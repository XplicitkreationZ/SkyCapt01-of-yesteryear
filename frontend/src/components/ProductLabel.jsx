import React from "react";
import QRCode from "react-qr-code";

export const ProductLabel = ({ name, size }) => {
  const logo = "https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/gj0h0vr4_XplicitkreationZ_20250626_162911_0000.png";
  const qrUrl = `https://xplicit-flower.preview.emergentagent.com/?p=${encodeURIComponent(name)}-${encodeURIComponent(size)}`;
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
      <div className="h-7 w-7 p-0.5 rounded-md bg-emerald-500/80">
        <svg viewBox="0 0 24 24" className="h-full w-full text-black" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M12 3a9 9 0 1 0 9 9a9 9 0 0 0-9-9m0 16a7 7 0 1 1 7-7a7 7 0 0 1-7 7"/><path fill="currentColor" d="M12 7a5 5 0 0 0-5 5h2a3 3 0 1 1 3 3v2a5 5 0 0 0 0-10"/></svg>
      </div>
    </div>
  );
};
