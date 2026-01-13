import React, { useMemo, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeliveryDisclaimer } from "@/components/DeliveryDisclaimer";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CartPage({ cart, setCart }){
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("TX");
  const [zip, setZip] = useState("");
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);

  const subtotal = useMemo(()=> cart.reduce((s,i)=> s + i.price * i.qty, 0), [cart]);

  const getQuote = async ()=>{
    if(!zip || !subtotal) return;
    const { data } = await axios.post(`${API}/delivery/quote`, { zip, subtotal });
    setQuote(data);
  };

  const placeOrder = async ()=>{
    if (!cart.length) return;
    if (!quote?.allowed) return;
    setLoading(true);
    try{
      const items = cart.map(c=> ({ product_id: c.id, quantity: c.qty }));
      const address = { name, phone, address1, city, state, zip, dob };
      await axios.post(`${API}/orders/delivery`, { items, address });
      setCart([]);
      window.location.href = "/order-confirmation?ok=1";
    }catch(e){
      console.error(e);
      alert(e?.response?.data?.detail || "Failed to place order");
    }finally{ setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6" data-testid="cart-page">
      <DeliveryDisclaimer />
      <h2 className="text-2xl text-white">Your cart</h2>
      {!cart.length ? <p className="text-zinc-300" data-testid="empty-cart">No items yet.</p> : (
        <div className="grid md:grid-cols-2 gap-8">
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
            <div className="flex justify-between text-white pt-2"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          </div>
          <div className="space-y-3">
            <h3 className="text-white font-semibold">Delivery details</h3>
            <Input data-testid="input-name" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} className="bg-zinc-900 border-emerald-500/30 text-white" />
            <Input data-testid="input-dob" placeholder="DOB (YYYY-MM-DD)" value={dob} onChange={e=>setDob(e.target.value)} className="bg-zinc-900 border-emerald-500/30 text-white" />
            <Input data-testid="input-phone" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} className="bg-zinc-900 border-emerald-500/30 text-white" />
            <Input data-testid="input-address1" placeholder="Address line 1" value={address1} onChange={e=>setAddress1(e.target.value)} className="bg-zinc-900 border-emerald-500/30 text-white" />
            <div className="grid grid-cols-3 gap-2">
              <Input data-testid="input-city" placeholder="City" value={city} onChange={e=>setCity(e.target.value)} className="bg-zinc-900 border-emerald-500/30 text-white" />
              <Input data-testid="input-state" placeholder="State" value={state} onChange={e=>setState(e.target.value)} className="bg-zinc-900 border-emerald-500/30 text-white" />
              <Input data-testid="input-zip" placeholder="ZIP" value={zip} onChange={e=>setZip(e.target.value)} onBlur={getQuote} className="bg-zinc-900 border-emerald-500/30 text-white" />
            </div>
            {quote && (
              <div className="text-sm text-zinc-300" data-testid="delivery-quote">
                <div>Zone: {quote.tier || 'N/A'} · Distance: {quote.distance_miles ?? '–'} mi</div>
                <div>Delivery fee: ${quote.fee.toFixed(2)}</div>
                <div>Minimum: ${quote.min_order.toFixed(2)} {quote.allowed ? '(met)' : '(not met)'}</div>
                {!quote.allowed && <div className="text-red-300">{quote.reason}</div>}
              </div>
            )}
            <Button data-testid="btn-get-quote" onClick={getQuote} className="rounded-full bg-emerald-500 text-black hover:bg-emerald-400">Get quote</Button>
            <Button data-testid="btn-place-order" disabled={!quote?.allowed || loading} onClick={placeOrder} className="w-full rounded-full bg-emerald-500 text-black hover:bg-emerald-400">Place order (card, mock)</Button>
          </div>
        </div>
      )}
    </div>
  );
}
