import React from "react";

export const DeliveryDisclaimer = ({ compact=false }) => (
  <div
    data-testid={compact ? "delivery-disclaimer-footer" : "delivery-disclaimer-banner"}
    className={`${compact ? "text-xs p-3" : "p-4"} rounded-xl border border-emerald-500/30 bg-zinc-900/70 text-zinc-200`}
  >
    <div className="text-emerald-400 font-semibold mb-1">Delivery Notice</div>
    <p className={`${compact? "text-[11px]" : "text-sm"}`}>
      XplicitKreationZ delivers hemp-derived products only. All products are derived from industrial hemp and
      contain less than 0.3% Delta-9 THC by dry weight. Delivery is provided by a third-party courier after payment
      and age verification (21+) are completed. Couriers do not verify ID, collect payment, or provide product information.
      Products are not marijuana and are not FDA approved.
    </p>
  </div>
);
