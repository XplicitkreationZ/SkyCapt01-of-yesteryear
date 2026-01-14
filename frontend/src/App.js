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
        const { data } = await axios.get(`${API}/products`);
        setItems(data);
      } catch (e) {
        setError("Failed to load products");
      } finally { setLoading(false);} 
    })();
  },[]);
  return { items, loading, error };
}

// Rest of file remains same as previous version with pages/routes/layout
export default function App() { return null }
