import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DeliveryDisclaimer } from "@/components/DeliveryDisclaimer";

export default function OrderConfirmation(){
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6" data-testid="order-confirmation-page">
      <h1 className="text-3xl text-white font-bold">Order received</h1>
      <p className="text-zinc-300">Thanks! Your order has been created and is pending dispatch. You’ll receive updates by email/SMS.</p>
      <DeliveryDisclaimer />
      <div>
        <Link to="/shop"><Button className="mt-2 rounded-full bg-emerald-500 text-black hover:bg-emerald-400" data-testid="back-to-shop-btn">Back to shop</Button></Link>
      </div>
    </div>
  );
}
