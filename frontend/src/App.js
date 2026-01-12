import React, { useEffect, useState, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
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
const isProd = typeof window !== 'undefined' && /xplicitkreationz\.com$/.test(window.location.hostname);
const showBg = !isProd;
import { Countdown } from "@/components/Countdown";
import { ErrorBoundary } from "@/components/ErrorBoundary";
const About = lazy(() => import("@/pages/About"));
const CartPage = lazy(() => import("@/pages/CartPage"));

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const brand = { green: "#33FF57", purple: "#7E2CFB", black: "#070707" };

const DisclaimerText = () => (
  <div className="space-y-4 text-sm leading-relaxed" data-testid="legal-text">
    <h3 className="text-emerald-400 font-semibold">FOOD AND DRUG ADMINISTRATION (FDA) DISCLOSURE</h3>
    <p>These statements have not been evaluated by the FDA and are not intended to diagnose, treat or cure any disease. Always check with your physician before starting a new dietary supplement program.</p>
    <p>We do not sell or distribute any products that are in violation of the United States Controlled Substances Act (US.CSA). The company may grow, sell and distribute hemp based products.</p>
    <p><strong>Shipping restrictions:</strong></p>
    <ul className="list-disc ml-5 space-y-1">
      <li>We cannot ship any cannabinoid products to: Alaska, Colorado, Delaware, Idaho, Iowa, Montana, New York, Nevada, Nebraska, North Dakota, Rhode Island, Vermont, Virginia, Utah, and Washington.</li>
      <li>We cannot ship any THCA or drinks to: Arkansas, Idaho, Iowa, Kansas, Louisiana, Minnesota, Mississippi, North Carolina, Rhode Island, South Carolina, South Dakota, Utah.</li>
      <li>We cannot ship any edibles or drinks to: Maine, New York, North Carolina and Ohio.</li>
    </ul>
    <p className="text-xs text-zinc-400">Laws evolve quickly; orders shipping to restricted locations will be canceled and refunded.</p>
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
        const { data } = await axios.get(`${API}/products`);
        setItems(data);
      } catch (e) {
        setError("Failed to load products");
      } finally { setLoading(false);} 
    })();
  },[]);
  return { items, loading, error };
}

const ComingSoon = () => {
  const [email, setEmail] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email");
    try {
      await axios.post(`${API}/waitlist`, { email, source: "coming-soon" });
      toast.success("You're on the list! We'll notify you.");
      setEmail("");
    } catch (err) {
      toast.error("Something went wrong");
    }
  };
  const launchAt = process.env.REACT_APP_LAUNCH_AT || null;
  return (
    <section className="relative min-h-[70vh] flex items-center" data-testid="coming-soon">
      {showBg && <AnimatedBackground />}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-emerald-400 uppercase tracking-widest text-sm">XplicitkreationZ</p>
        <h1 className="text-5xl md:text-6xl font-extrabold text-white mt-2">Coming soon</h1>
        <p className="text-zinc-300 mt-4 max-w-2xl">Premium THCA flower, prerolls, edibles and more. Join the waitlist to get launch drops and exclusive access.</p>
        <Countdown targetISO={launchAt} />
        <form onSubmit={submit} className="mt-6 flex gap-3 max-w-md" data-testid="waitlist-form">
          <Input data-testid="waitlist-email-input" type="email" placeholder="Email address" value={email} onChange={(e)=>setEmail(e.target.value)} className="bg-zinc-900 border-emerald-500/30 text-white" />
          <Button data-testid="waitlist-submit-btn" type="submit" className="rounded-full bg-emerald-500 text-black hover:bg-emerald-400">Notify me</Button>
        </form>
        <div className="mt-4 text-zinc-500 text-xs">By joining, you confirm you are 21+.</div>
        <div className="mt-8">
          <Link to="/shop" className="text-emerald-400 underline" data-testid="preview-shop-link">Preview the shop →</Link>
        </div>
      </div>
    </section>
  );
};

const Hero = () => (
  <section className="relative overflow-hidden" data-testid="hero">
    {showBg && <AnimatedBackground />}
    <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-[1.2fr_.8fr] gap-10 items-center">
      <div>
        <h1 className="font-['Space_Grotesk'] text-5xl md:text-6xl font-extrabold leading-tight text-white" data-testid="hero-title">XplicitkreationZ Exotics</h1>
        <p className="text-zinc-300 mt-4 max-w-xl">Premium THCA flower and prerolls for true connoisseurs. Small-batch craft. Big terp energy.</p>
        <div className="mt-6 flex gap-3">
          <a href="#products" data-testid="shop-now-btn"><Button className="rounded-full bg-emerald-500 text-black hover:bg-emerald-400">Shop now</Button></a>
          <Link to="/about" data-testid="learn-about-btn"><Button variant="secondary" className="rounded-full border-emerald-500/40 bg-transparent text-emerald-300 hover:bg-emerald-500/10">About us</Button></Link>
        </div>
      </div>
      <div className="justify-self-center">
        <img alt="prerolls" className="h-72 w-72 object-cover rounded-xl ring-2 ring-emerald-500/40" src={HERO_IMAGES.preroll2}/>
      </div>
    </div>
  </section>
);

const Catalog = ({ addToCart }) => {
  const { items, loading, error } = useProducts();
  if (loading) return <p className="px-4 text-zinc-300" data-testid="catalog-loading">Loading…</p>;
  if (error) return <p className="px-4 text-red-300" data-testid="catalog-error">{error}</p>;
  return (
    <section id="products" className="max-w-6xl mx-auto px-4 py-10" data-testid="catalog-grid">
      <h2 className="text-2xl text-white mb-6">Our Products</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-950/70 border-emerald-500/30">
          <CardHeader><CardTitle className="text-white">Prerolls</CardTitle></CardHeader>
          <CardContent>
            <div className="relative">
              <img alt="prerolls" src={HERO_IMAGES.preroll1} className="h-40 w-full object-cover rounded-md mb-3"/>
              <ProductLabel name="Prerolls" size="2g" />
            </div>
            <p className="text-zinc-300 text-sm">Smooth burn, bold terp profile.</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950/70 border-emerald-500/30">
          <CardHeader><CardTitle className="text-white">Flower Buds</CardTitle></CardHeader>
          <CardContent>
            <div className="relative">
              <img alt="buds" src={HERO_IMAGES.budsPile} className="h-40 w-full object-cover rounded-md mb-3"/>
              <ProductLabel name="Craft Flower" size="3.5g" />
            </div>
            <p className="text-zinc-300 text-sm">Trichome-rich, hand selected.</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950/70 border-emerald-500/30">
          <CardHeader><CardTitle className="text-white">Jar Reserve</CardTitle></CardHeader>
          <CardContent>
            <div className="relative">
              <img alt="jar" src={HERO_IMAGES.jarBuds} className="h-40 w-full object-cover rounded-md mb-3"/>
              <ProductLabel name="Jar Reserve" size="7g" />
            </div>
            <p className="text-zinc-300 text-sm">Fresh-sealed, curated batches.</p>
          </CardContent>
        </Card>
        {items.map(p=> (
          <Card key={p.id} className="bg-zinc-950/70 border-emerald-500/30 hover:border-emerald-400/60 transition-colors" data-testid={`product-card-${p.id}`}>
            <CardHeader>
              <CardTitle className="text-white text-lg">{p.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <img alt={p.name} src={p.image_url} className="h-40 w-full object-cover rounded-md mb-3"/>
                <ProductLabel name={p.name.split(" ")[0]} size={p.size} />
              </div>
              <p className="text-emerald-300 text-sm">{p.strain_type} · {p.size}</p>
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
  <div className="min-h-screen" style={{background: brand.black}}>
    <div className="absolute inset-0 -z-10" style={{background:"radial-gradient(800px 300px at 20% -5%, rgba(126,44,251,.25), transparent), radial-gradient(800px 300px at 80% -5%, rgba(16,185,129,.25), transparent)"}}/>
    <Nav cartCount={cartCount} />
    <main className="pb-20">{children}</main>
    <footer className="border-t border-emerald-500/20 py-10 mt-10" data-testid="footer">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8">
        <div>
          <p className="text-white font-semibold">XplicitkreationZ</p>
          <p className="text-zinc-400 text-sm">Craft THCA products. © {new Date().getFullYear()}</p>
        </div>
        <div>
          <DisclaimerText />
        </div>
      </div>
    </footer>
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
      {/* Disable age gate on root path (coming soon), keep on others */}
      {(!ageOk && (typeof window === 'undefined' ? true : window.location.pathname !== '/')) && (
        <AgeGate onPass={()=> setAgeOk(true)} />
      )}
      <BrowserRouter>
        <ErrorBoundary>
          <Layout cartCount={cart.reduce((s,i)=>s+i.qty,0)}>
            <Suspense fallback={<div className="p-6 text-zinc-300" data-testid="lazy-loading">Loading…</div>}>
              <Routes>
                <Route path="/" element={<ComingSoon />} />
                <Route path="/shop" element={<Home addToCart={addToCart} />} />
                <Route path="/about" element={<About />} />
                <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} />} />
              </Routes>
            </Suspense>
          </Layout>
        </ErrorBoundary>
      </BrowserRouter>
    </div>
  );
}

export default App;
