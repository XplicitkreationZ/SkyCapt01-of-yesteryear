import React from "react";

const logo = "https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/gj0h0vr4_XplicitkreationZ_20250626_162911_0000.png";

export const AnimatedBackground = () => {
  const items = [
    { top: "5%", left: "8%", size: 90, delay: 0, speed: "xz-drift" },
    { top: "15%", right: "10%", size: 120, delay: 3, speed: "xz-drift-slow" },
    { top: "55%", left: "-2%", size: 110, delay: 6, speed: "xz-drift" },
    { bottom: "6%", right: "6%", size: 100, delay: 1.5, speed: "xz-drift-slow" },
    { bottom: "-4%", left: "30%", size: 140, delay: 4.2, speed: "xz-drift" },
  ];
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* subtle vignette */}
      <div className="absolute inset-0" style={{background:"radial-gradient(1200px 400px at 50% -10%, rgba(16,185,129,.20), transparent)"}}/>
      {items.map((p, i) => (
        <img
          key={i}
          alt="XplicitkreationZ floating logo"
          src={logo}
          style={{ ...p, width: p.size, height: p.size, animationDelay: `${p.delay}s` }}
          className={`absolute opacity-[0.10] saturate-[1.2] ${p.speed} drop-shadow-[0_0_35px_rgba(16,185,129,0.25)]`}
        />
      ))}
    </div>
  );
};
