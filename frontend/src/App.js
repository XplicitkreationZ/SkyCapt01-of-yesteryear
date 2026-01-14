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
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
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

const CATEGORIES = [
  { id: 'all', label: 'All Products', icon: '🛒' },
  { id: 'Consumable', label: 'Consumables', icon: '🌿' },
  { id: 'Accessory', label: 'Accessories', icon: '📦' },
  { id: 'Nitrous', label: 'Nitrous', icon: '⚡' },
];

const Catalog = ({ addToCart }) => {
  const { items, loading, error } = useProducts();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categoryCounts = items.reduce((acc, p) => {
    const cat = p.category || 'Other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, { all: items.length });

  if (loading) return <p className="px-4 text-zinc-300" data-testid="catalog-loading">Loading…</p>;
  if (error) return <p className="px-4 text-red-300" data-testid="catalog-error">{error}</p>;
  
  return (
    <section id="products" className="max-w-6xl mx-auto px-4 py-10" data-testid="catalog-grid">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl text-white">Our Products</h2>
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-zinc-900/60 border-emerald-500/30 text-white placeholder:text-zinc-500 pl-10 rounded-full"
            data-testid="search-input"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              data-testid="clear-search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8" data-testid="category-filters">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              activeCategory === cat.id
                ? 'bg-emerald-500 text-black'
                : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700/60 border border-emerald-500/20'
            }`}
            data-testid={`filter-${cat.id}`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
              activeCategory === cat.id ? 'bg-black/20' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {categoryCounts[cat.id] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Results Count */}
      {(searchQuery || activeCategory !== 'all') && (
        <p className="text-zinc-400 text-sm mb-4" data-testid="results-count">
          Showing {filteredItems.length} {filteredItems.length === 1 ? 'product' : 'products'}
          {searchQuery && ` for "${searchQuery}"`}
          {activeCategory !== 'all' && ` in ${activeCategory}`}
        </p>
      )}

      {/* Product Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16" data-testid="no-results">
          <p className="text-zinc-400 text-lg mb-2">No products found</p>
          <p className="text-zinc-500 text-sm">Try adjusting your search or filter</p>
          <Button 
            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
            className="mt-4 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(p=> (
            <Card key={p.id} className="bg-zinc-950/70 border-emerald-500/30 hover:border-emerald-400/60 transition-colors group" data-testid={`product-card-${p.id}`}>
              <CardHeader><CardTitle className="text-white text-lg">{p.name}</CardTitle></CardHeader>
              <CardContent>
                <Link to={`/product/${p.id}`} className="block relative cursor-pointer">
                  <img alt={p.name} src={p.image_url} className="h-40 w-full object-contain rounded-md mb-3 group-hover:scale-105 transition-transform"/>
                  <ProductLabel name={(p.brand||p.name).split(" ")[0]} size={p.size || p.category} />
                </Link>
                <p className="text-emerald-300 text-sm">{p.category ? `${p.category}${p.brand? ' · '+p.brand:''}` : `${p.strain_type || ''}${p.size? ' · '+p.size:''}`}</p>
                <p className="text-zinc-300 text-sm mt-2 line-clamp-2">{p.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-white font-semibold">${p.price.toFixed(2)}</span>
                  <Button data-testid={`add-to-cart-${p.id}`} onClick={(e)=> { e.stopPropagation(); addToCart(p); }} className="rounded-full bg-emerald-500 text-black hover:bg-emerald-400">Add to cart</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
                <Route path="/shop" element={<Home addToCart={addToCart} />} />
                <Route path="/product/:productId" element={<ProductDetail addToCart={addToCart} />} />
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
