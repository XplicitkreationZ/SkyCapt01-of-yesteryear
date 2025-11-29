import React from "react";
import { Button } from "@/components/ui/button";

export default function CartPage({ cart, setCart }){
  const subtotal = cart.reduce((s,i)=> s + i.price * i.qty, 0);
  const tax = 0;
  const total = (subtotal + tax).toFixed(2);
  const checkout = async () => {
    if (!cart.length) return;
    // mock handled in parent via API call route previously
    setCart([]);
  };
  return (
    <div className="max-w-4xl mx-auto px-4 py-10" data-testid="cart-page">
      <h2 className="text-2xl text-white mb-6">Your cart</h2>
      {!cart.length ? <p className="text-zinc-300" data-testid="empty-cart">No items yet.</p> : (
        <div className="space-y-4">
          {cart.map(item=> (
            <div key={item.id} className="flex items-center justify-between border-b border-emerald-500/20 pb-3" data-testid={`cart-item-${item.id}`}>
              <div className="flex items-center gap-3">
                <img alt="prod" src={item.image_url} className="h-14 w-14 rounded object-cover"/>
                <div>
                  <p className="text-white text-sm">{item.name}</p>
                  <p className="text-zinc-400 text-xs">{item.size} · {item.strain_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-zinc-300 text-sm">Qty</span>
                <input data-testid={`qty-input-${item.id}`} type="number" min="1" value={item.qty} onChange={(e)=>{
                  const v = Math.max(1, Number(e.target.value));
                  setCart(prev=> prev.map(p=> p.id===item.id? {...p, qty:v}:p));
                }} className="w-16 rounded bg-zinc-900 border border-emerald-500/30 text-white px-2 py-1"/>
                <span className="text-white font-semibold">${(item.price*item.qty).toFixed(2)}</span>
                <Button data-testid={`remove-item-${item.id}`} onClick={()=> setCart(prev=> prev.filter(p=> p.id!==item.id))} variant="secondary" className="rounded-full bg-transparent border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10">Remove</Button>
              </div>
            </div>
          ))}
          <div className="flex justify-end text-white gap-8 pt-4">
            <div className="text-right space-y-1">
              <div className="flex justify-between gap-8"><span className="text-zinc-300">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between gap-8"><span className="text-zinc-300">Tax</span><span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between gap-8 font-semibold"><span>Total</span><span data-testid="cart-total">${total}</span></div>
              <Button data-testid="checkout-btn" onClick={checkout} className="mt-3 w-full rounded-full bg-emerald-500 text-black hover:bg-emerald-400">Checkout (mock)</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
