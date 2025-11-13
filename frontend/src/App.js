import React, { useEffect, useMemo, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const brand = {
  green: "#33FF57",
  purple: "#7E2CFB",
  black: "#070707",
};

const Nav = ({ cartCount }) => (
  <nav className="sticky top-0 z-40 backdrop-blur-xl bg-black/65 border-b border-emerald-500/30" data-testid="navbar">
    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3" data-testid="navbar-logo">
        <img alt="XplicitkreationZ logo" src="https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/gj0h0vr4_XplicitkreationZ_20250626_162911_0000.png" className="h-10 w-10 rounded-full ring-2 ring-emerald-500"/>
        <span className="font-semibold tracking-wide text-emerald-400">XplicitkreationZ</span>
      </Link>
      <div className="flex gap-4 items-center">
        <Link to="/about" className="text-sm text-zinc-200 hover:text-emerald-400" data-testid="navbar-about">About</Link>
        <Link to="/cart" className="relative" data-testid="navbar-cart">
          <Button variant="secondary" className="rounded-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30">Cart
            <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-black text-xs" data-testid="cart-count">{cartCount}</span>
          </Button>
        </Link>
      </div>
    </div>
  </nav>
);

const AgeGate = ({ onPass }) => {
  const [checked, setChecked] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" data-testid="age-gate">
      <div className="w-[90%] max-w-md rounded-2xl p-6 border border-emerald-500/40 bg-zinc-950 shadow-[0_0_60px_rgba(16,185,129,0.25)]">
        <h2 className="text-2xl font-semibold text-emerald-400 mb-2">21+ to enter</h2>
        <p className="text-zinc-300 text-sm mb-5">By entering, you confirm you are at least 21 years old.</p>
        <label className="flex items-center gap-2 text-zinc-200 text-sm mb-4">
          <input data-testid="age-gate-checkbox" type="checkbox" className="accent-emerald-500" checked={checked} onChange={(e)=>setChecked(e.target.checked)} />
          I am 21 or older
        </label>
        <Button data-testid="age-gate-enter" onClick={()=> checked ? onPass() : toast.error("Please confirm your age") } className="w-full bg-emerald-500 text-black hover:bg-emerald-400 rounded-full">Enter</Button>
      </div>
    </div>
  );
};

function useProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(()=>{
    (async ()=>{
      try {
        await axios.post(`${API}/seed`);
        const { data } = await axios.get(`${API}/products`);
        setItems(data);
      } catch (e) {
        setError("Failed to load products");
      } finally { setLoading(false);} 
    })();
  },[]);
  return { items, loading, error };
}

const Hero = () => (
  <section className="relative overflow-hidden" data-testid="hero">
    <div className="absolute inset-0 opacity-20" style={{background:"radial-gradient(1200px 400px at 50% -10%, rgba(16,185,129,.45), transparent)"}}/>
    <div className="max-w-6xl mx-auto px-4 py-14 grid md:grid-cols-[1.2fr_.8fr] gap-10 items-center">
      <div>
        <h1 className="font-[\'Space_Grotesk\'] text-5xl md:text-6xl font-extrabold leading-tight text-white" data-testid="hero-title">Premium THCA Flower</h1>
        <p className="text-zinc-300 mt-4 max-w-xl">Small-batch craft by XplicitkreationZ. Potent profiles, bold flavor. Legal shipping to compliant states.</p>
        <div className="mt-6 flex gap-3">
          <a href="#catalog" data-testid="shop-now-btn"><Button className="rounded-full bg-emerald-500 text-black hover:bg-emerald-400">Shop now</Button></a>
          <Link to="/about" data-testid="learn-about-btn"><Button variant="secondary" className="rounded-full border-emerald-500/40 bg-transparent text-emerald-300 hover:bg-emerald-500/10">About us</Button></Link>
        </div>
      </div>
      <div className="justify-self-center">
        <img alt="brand mark" className="h-60 w-60 md:h-72 md:w-72" src="https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/gj0h0vr4_XplicitkreationZ_20250626_162911_0000.png"/>
      </div>
    </div>
  </section>
);

const Catalog = ({ addToCart }) => {
  const { items, loading, error } = useProducts();
  if (loading) return <p className="px-4 text-zinc-300" data-testid="catalog-loading">Loading…</p>;
  if (error) return <p className="px-4 text-red-300" data-testid="catalog-error">{error}</p>;
  return (
    <section id="catalog" className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="catalog-grid">
      {items.map(p=> (
        <Card key={p.id} className="bg-zinc-950/70 border-emerald-500/30 hover:border-emerald-400/60 transition-colors" data-testid={`product-card-${p.id}`}>
          <CardHeader>
            <CardTitle className="text-white text-lg">{p.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <img alt={p.name} src={p.image_url} className="h-40 w-full object-cover rounded-md mb-3"/>
            <p className="text-emerald-300 text-sm">{p.strain_type} · {p.size}</p>
            <p className="text-zinc-300 text-sm mt-2 line-clamp-2">{p.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-white font-semibold">${p.price.toFixed(2)}</span>
              <Button data-testid={`add-to-cart-${p.id}`} onClick={()=> addToCart(p)} className="rounded-full bg-emerald-500 text-black hover:bg-emerald-400">Add to cart</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
};

const CartPage = ({ cart, setCart }) => {
  const navigate = useNavigate();
  const subtotal = cart.reduce((s,i)=> s + i.price * i.qty, 0);
  const tax = 0; // later
  const total = (subtotal + tax).toFixed(2);
  const checkout = async () => {
    if (!cart.length) return toast.error("Cart is empty");
    const items = cart.map(c=> ({ product_id: c.id, quantity: c.qty }));
    const { data } = await axios.post(`${API}/orders`, items);
    toast.success(`Order placed (mock) · Total $${data.total}`);
    setCart([]);
    navigate("/");
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
};

const About = () => (
  <div className="max-w-5xl mx-auto px-4 py-12" data-testid="about-page">
    <h2 className="text-3xl text-white mb-4">About XplicitkreationZ</h2>
    <p className="text-zinc-300 leading-relaxed max-w-3xl">
      XplicitkreationZ is changing the game with small-batch THCA and CBD products for both fun and function. From euphoria to wellness—edibles, premium flower, vapes and topicals crafted with quality ingredients and bold flavor. Everyone 21+ is welcome. Shipping to compliant states.
    </p>
  </div>
);

const Layout = ({ children, cartCount }) => (
  <div className="min-h-screen" style={{background: brand.black}}>
    <div className="absolute inset-0 -z-10" style={{background:"radial-gradient(800px 300px at 20% -5%, rgba(126,44,251,.25), transparent), radial-gradient(800px 300px at 80% -5%, rgba(16,185,129,.25), transparent)"}}/>
    <Nav cartCount={cartCount} />
    <main className="pb-20">{children}</main>
    <Toaster richColors />
  </div>
);

const Home = ({ addToCart }) => (
  <>
    <Hero />
    <Catalog addToCart={addToCart} />
  </>
);

function App() {
  const [ageOk, setAgeOk] = useState(false);
  const [cart, setCart] = useState([]);
  const addToCart = (p)=>{
    setCart(prev=>{
      const ex = prev.find(i=> i.id===p.id);
      if (ex) return prev.map(i=> i.id===p.id? {...i, qty:i.qty+1}: i);
      return [...prev, {...p, qty:1}];
    });
    toast.success("Added to cart");
  };
  return (
    <div className="App" data-testid="app-root">
      {!ageOk && <AgeGate onPass={()=> setAgeOk(true)} />}
      <BrowserRouter>
        <Layout cartCount={cart.reduce((s,i)=>s+i.qty,0)}>
          <Routes>
            <Route path="/" element={<Home addToCart={addToCart} />} />
            <Route path="/about" element={<About />} />
            <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </div>
  );
}

export default App;
