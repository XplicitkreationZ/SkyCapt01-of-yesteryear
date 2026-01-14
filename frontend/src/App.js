import React, { useEffect, useState, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HERO_IMAGES } from "@/components/HeroImages";
import { ProductLabel } from "@/components/ProductLabel";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Countdown } from "@/components/Countdown";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DeliveryDisclaimer } from "@/components/DeliveryDisclaimer";
const About = lazy(() => import("@/pages/About"));
const CartPage = lazy(() => import("@/pages/CartPage"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const OrderConfirmation = lazy(() => import("@/pages/OrderConfirmation"));
const isProd = typeof window !== 'undefined' && /xplicitkreationz\.com$/.test(window.location.hostname);
const showBg = !isProd;

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DisclaimerText = () => (
  <div className="space-y-4 text-sm leading-relaxed" data-testid="legal-text">
    <h3 className="text-emerald-400 font-semibold">FOOD AND DRUG ADMINISTRATION (FDA) DISCLOSURE</h3>
    <p>These statements have not been evaluated by the FDA and are not intended to diagnose, treat or cure any disease. Always check with your physician before starting a new dietary supplement program.</p>
    <p>We do not sell or distribute any products that are in violation of the United States Controlled Substances Act (US.CSA). The company may grow, sell and distribute hemp based products.</p>
  </div>
);

const Nav = ({ cartCount }) => (
  <nav className="sticky top-0 z-40 backdrop-blur-xl bg-black/65 border-b border-emerald-500/30" data-testid="navbar">
    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3" data-testid="navbar-logo">
        <img alt="XplicitkreationZ logo" src="https://customer-assets.emergentagent.com/job_838e7894-9ca5-4fdc-9a53-648137f2413a/artifacts/gj0h0vr4_XplicitkreationZ_20250626_162911_0000.png" className="h-10 w-10 rounded-full ring-2 ring-emerald-500"/>
        <span className="font-semibold tracking-wide text-emerald-400">XplicitkreationZ</span>
      </Link>
      <div className="flex gap-4 items-center">
        <Link to="/shop" className="text-sm text-zinc-200 hover:text-emerald-400" data-testid="navbar-shop">Shop</Link>
        <Link to="/faq" className="text-sm text-zinc-200 hover:text-emerald-400" data-testid="navbar-faq">FAQ</Link>
        <Link to="/about" className="text-sm text-zinc-200 hover:text-emerald-400" data-testid="navbar-about">About</Link>
        <Link to="/cart" className="relative" data-testid="navbar-cart">
          <Button variant="secondary" className="rounded-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30">Cart
            <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-black text-xs" data-testid="cart-count">{cartCount}</span>
          </Button>
        </Link>
        <Dialog>
          <DialogTrigger asChild>
            <Button data-testid="navbar-legal" variant="secondary" className="rounded-full bg-transparent border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10">Legal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl bg-zinc-950 border-emerald-500/30">
            <DialogHeader>
              <DialogTitle className="text-white">Legal Disclaimer</DialogTitle>
            </DialogHeader>
            <DisclaimerText />
          </DialogContent>
        </Dialog>
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
        await axios.post(`${API}/admin/seed-accessories`);
        await axios.post(`${API}/admin/seed-glass`);
        await axios.post(`${API}/admin/seed-n2o`);
        const { data } = await axios.get(`${API}/products`);
        setItems(data);
      } catch (e) {
        setError("Failed to load products");
      } finally { setLoading(false);} 
    })();
  },[]);
  return { items, loading, error };
}

const ComingSoon = () => { return null };
const Hero = () => { return null };

const Catalog = ({ addToCart }) => {
  const { items, loading, error } = useProducts();
  if (loading) return <p className="px-4 text-zinc-300" data-testid="catalog-loading">Loading…</p>;
  if (error) return <p className="px-4 text-red-300" data-testid="catalog-error">{error}</p>;
  return (
    <section id="products" className="max-w-6xl mx-auto px-4 py-10" data-testid="catalog-grid">
      <h2 className="text-2xl text-white mb-6">Our Products</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(p=> (
          <Card key={p.id} className="bg-zinc-950/70 border-emerald-500/30 hover:border-emerald-400/60 transition-colors" data-testid={`product-card-${p.id}`}>
            <CardHeader><CardTitle className="text-white text-lg">{p.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="relative">
                <img alt={p.name} src={p.image_url} className="h-40 w-full object-cover rounded-md mb-3"/>
                <ProductLabel name={(p.brand||p.name).split(" ")[0]} size={p.size || p.category} />
              </div>
              <p className="text-emerald-300 text-sm">{p.category ? `${p.category}${p.brand? ' · '+p.brand:''}` : `${p.strain_type || ''}${p.size? ' · '+p.size:''}`}</p>
              <p className="text-zinc-300 text-sm mt-2 line-clamp-2">{p.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-white font-semibold">${p.price.toFixed(2)}</span>
                <Button data-testid={`add-to-cart-${p.id}`} onClick={()=> addToCart(p)} className="rounded-full bg-emerald-500 text-black hover:bg-emerald-400">Add to cart</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

const Layout = ({ children, cartCount }) => (
  <div className="min-h-screen">
    <Nav cartCount={cartCount} />
    <main className="pb-20">{children}</main>
    <footer className="border-t border-emerald-500/20 py-10 mt-10" data-testid="footer">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8">
        <div>
          <p className="text-white font-semibold">XplicitkreationZ</p>
          <p className="text-zinc-400 text-sm">Local hemp delivery. © {new Date().getFullYear()}</p>
        </div>
        <div><DeliveryDisclaimer compact /></div>
      </div>
    </footer>
    <Toaster richColors />
  </div>
);

const Home = ({ addToCart }) => (<Catalog addToCart={addToCart} />);

export default function App() {
  const [ageOk, setAgeOk] = useState(false);
  const [cart, setCart] = useState([]);
  const addToCart = (p)=>{ setCart(prev=>{ const ex=prev.find(i=>i.id===p.id); if(ex) return prev.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i); return [...prev,{...p,qty:1}];}); toast.success("Added to cart"); };
  return (
    <div className="App" data-testid="app-root">
      {(!ageOk && (typeof window === 'undefined' ? true : window.location.pathname !== '/')) && (<AgeGate onPass={()=> setAgeOk(true)} />)}
      <BrowserRouter>
        <ErrorBoundary>
          <Layout cartCount={cart.reduce((s,i)=>s+i.qty,0)}>
            <Suspense fallback={<div className="p-6 text-zinc-300" data-testid="lazy-loading">Loading…</div>}>
              <Routes>
                <Route path="/" element={<Home addToCart={addToCart} />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/about" element={<About />} />
                <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
              </Routes>
            </Suspense>
          </Layout>
        </ErrorBoundary>
      </BrowserRouter>
    </div>
  );
}
