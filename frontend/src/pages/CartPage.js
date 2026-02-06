import React, { useMemo, useState, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeliveryDisclaimer } from "@/components/DeliveryDisclaimer";
import { PaymentForm, CreditCard } from "react-square-web-payments-sdk";
import { toast } from "sonner";
import { Upload, CheckCircle, AlertCircle, Camera, X } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const SQUARE_APP_ID = process.env.REACT_APP_SQUARE_APP_ID;
const SQUARE_LOCATION_ID = process.env.REACT_APP_SQUARE_LOCATION_ID;

export default function CartPage({ cart, setCart }){
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("TX");
  const [zip, setZip] = useState("");
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  
  // ID Verification states
  const [idImage, setIdImage] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [idVerified, setIdVerified] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const fileInputRef = useRef(null);

  const subtotal = useMemo(()=> cart.reduce((s,i)=> s + i.price * i.qty, 0), [cart]);

  const handleIdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadingId(true);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setIdPreview(reader.result);
      setIdImage(reader.result); // Base64 encoded image
      setIdVerified(true);
      setUploadingId(false);
      toast.success("ID uploaded successfully!");
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setUploadingId(false);
    };
    reader.readAsDataURL(file);
  };

  const removeId = () => {
    setIdImage(null);
    setIdPreview(null);
    setIdVerified(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getQuote = async ()=>{
    if(!zip || !subtotal) return;
    const { data } = await axios.post(`${API}/delivery/quote`, { zip, subtotal });
    setQuote(data);
  };

  const createOrder = async ()=>{
    if (!cart.length) return;
    if (!quote?.allowed) return;
    if (!name || !dob || !phone || !address1 || !city || !zip) {
      toast.error("Please fill in all delivery details");
      return;
    }
    if (!idVerified || !idImage) {
      toast.error("Please upload a valid ID for age verification");
      return;
    }
    setLoading(true);
    try{
      const items = cart.map(c=> ({ 
        product_id: c.id, 
        quantity: c.qty,
        name: c.name,
        price: c.price,
        variant: c.selectedVariant?.name || null
      }));
      const address = { name, phone, address1: address1, city, state, zip, dob, email };
      const { data } = await axios.post(`${API}/orders/delivery`, { 
        items, 
        address,
        id_image: idImage // Include the ID image
      });
      setOrderId(data.order_id);
      setOrderTotal(data.total);
      setShowPayment(true);
      toast.success("Order created! Please complete payment.");
    }catch(e){
      console.error(e);
      const errorMsg = e?.response?.data?.detail || e?.message || "Failed to create order";
      toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }finally{ setLoading(false); }
  };

  const handlePaymentComplete = async (token) => {
    setLoading(true);
    try {
      const amountInCents = Math.round(orderTotal * 100);
      const { data } = await axios.post(`${API}/payments/square`, {
        source_id: token.token,
        amount: amountInCents,
        currency: "USD",
        order_id: orderId,
        customer_email: email,
        customer_name: name
      });
      
      if (data.success) {
        setCart([]);
        toast.success("Payment successful!");
        window.location.href = `/order-confirmation?ok=1&order=${orderId}`;
      }
    } catch (e) {
      console.error(e);
      const errorMsg = e?.response?.data?.detail || e?.message || "Payment failed. Please try again.";
      toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  const total = quote ? subtotal + quote.fee : subtotal;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6" data-testid="cart-page">
      <DeliveryDisclaimer />
      <h2 className="text-2xl text-white">Your Cart</h2>
      {!cart.length ? <p className="text-zinc-300" data-testid="empty-cart">No items yet.</p> : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Cart Items */}
          <div className="space-y-4">
            {cart.map(item=> (
              <div key={`${item.id}-${item.selectedVariant?.name || ''}`} className="flex items-center justify-between border-b border-emerald-500/20 pb-3" data-testid={`cart-item-${item.id}`}>
                <div className="flex items-center gap-3">
                  <img alt="prod" src={item.image_url} className="h-14 w-14 rounded object-contain bg-zinc-800"/>
                  <div>
                    <p className="text-white text-sm">{item.name}</p>
                    <p className="text-zinc-400 text-xs">
                      {item.selectedVariant ? `${item.selectedVariant.name} (${item.selectedVariant.type})` : `${item.size || ''} ${item.strain_type || ''}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-300 text-sm">Qty</span>
                  <input data-testid={`qty-input-${item.id}`} type="number" min="1" value={item.qty} onChange={(e)=>{
                    const v = Math.max(1, Number(e.target.value));
                    setCart(prev=> prev.map(p=> (p.id===item.id && p.selectedVariant?.name===item.selectedVariant?.name)? {...p, qty:v}:p));
                  }} className="w-16 rounded bg-zinc-900 border border-emerald-500/30 text-white px-2 py-1"/>
                  <span className="text-white font-semibold">${(item.price*item.qty).toFixed(2)}</span>
                  <Button data-testid={`remove-item-${item.id}`} onClick={()=> setCart(prev=> prev.filter(p=> !(p.id===item.id && p.selectedVariant?.name===item.selectedVariant?.name)))} variant="secondary" className="rounded-full bg-transparent border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 text-xs px-2">✕</Button>
                </div>
              </div>
            ))}
            
            {/* Order Summary */}
            <div className="pt-4 space-y-2 border-t border-zinc-700">
              <div className="flex justify-between text-zinc-300"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              {quote && (
                <>
                  <div className="flex justify-between text-zinc-300"><span>Delivery ({quote.tier})</span><span>${quote.fee.toFixed(2)}</span></div>
                  <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-zinc-700"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </>
              )}
            </div>
          </div>

          {/* Checkout Form */}
          <div className="space-y-4">
            {!showPayment ? (
              <>
                <h3 className="text-white font-semibold text-lg">Delivery Details</h3>
                <Input data-testid="input-name" placeholder="Full name (as on ID) *" value={name} onChange={e=>setName(e.target.value)} className="bg-zinc-900 border-emerald-500/30 text-white" />
                <Input data-testid="input-email" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} className="bg-zinc-900 border-emerald-500/30 text-white" />
                <Input data-testid="input-dob" placeholder="Date of Birth (YYYY-MM-DD) *" value={dob} onChange={e=>setDob(e.target.value)} className="bg-zinc-900 border-emerald-500/30 text-white" />
                <Input data-testid="input-phone" placeholder="Phone *" value={phone} onChange={e=>setPhone(e.target.value)} className="bg-zinc-900 border-emerald-500/30 text-white" />
                <Input data-testid="input-address1" placeholder="Street Address *" value={address1} onChange={e=>setAddress1(e.target.value)} className="bg-zinc-900 border-emerald-500/30 text-white" />
                <div className="grid grid-cols-3 gap-2">
                  <Input data-testid="input-city" placeholder="City *" value={city} onChange={e=>setCity(e.target.value)} className="bg-zinc-900 border-emerald-500/30 text-white" />
                  <Input data-testid="input-state" placeholder="State" value={state} onChange={e=>setState(e.target.value)} className="bg-zinc-900 border-emerald-500/30 text-white" disabled />
                  <Input data-testid="input-zip" placeholder="ZIP *" value={zip} onChange={e=>setZip(e.target.value)} onBlur={getQuote} className="bg-zinc-900 border-emerald-500/30 text-white" />
                </div>
                
                {/* ID Verification Section */}
                <div className="p-4 rounded-lg bg-zinc-900/70 border border-amber-500/30 space-y-3" data-testid="id-verification-section">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    <h4 className="text-amber-400 font-semibold">21+ Age Verification Required</h4>
                  </div>
                  <p className="text-zinc-400 text-sm">
                    Upload a photo of your valid government-issued ID (driver's license, state ID, or passport). 
                    Your ID will be verified at delivery.
                  </p>
                  
                  {!idPreview ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-emerald-500/40 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-400/60 hover:bg-emerald-500/5 transition-all"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleIdUpload}
                        className="hidden"
                        data-testid="id-file-input"
                      />
                      {uploadingId ? (
                        <div className="text-emerald-400">
                          <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p>Processing...</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-center gap-4 mb-3">
                            <Upload className="w-8 h-8 text-emerald-400" />
                            <Camera className="w-8 h-8 text-emerald-400" />
                          </div>
                          <p className="text-emerald-400 font-medium">Tap to upload or take photo of ID</p>
                          <p className="text-zinc-500 text-xs mt-1">Accepted: JPG, PNG, HEIC (max 10MB)</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="rounded-lg overflow-hidden border border-emerald-500/40">
                        <img 
                          src={idPreview} 
                          alt="ID Preview" 
                          className="w-full h-40 object-cover"
                          data-testid="id-preview"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">ID Uploaded</span>
                        </div>
                        <Button 
                          onClick={removeId}
                          variant="ghost" 
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm"
                          data-testid="remove-id-btn"
                        >
                          <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {quote && (
                  <div className="p-4 rounded-lg bg-zinc-900/50 border border-emerald-500/20" data-testid="delivery-quote">
                    <div className="text-sm text-zinc-300 space-y-1">
                      <div className="flex justify-between"><span>Zone:</span><span className="text-emerald-400">{quote.tier || 'N/A'}</span></div>
                      <div className="flex justify-between"><span>Distance:</span><span>{quote.distance_miles?.toFixed(1) ?? '–'} mi</span></div>
                      <div className="flex justify-between"><span>Delivery fee:</span><span>${quote.fee.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Minimum order:</span><span>${quote.min_order.toFixed(2)} {quote.allowed ? <span className="text-emerald-400">✓</span> : <span className="text-red-400">✗</span>}</span></div>
                      {!quote.allowed && <div className="text-red-400 text-center pt-2">{quote.reason}</div>}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button data-testid="btn-get-quote" onClick={getQuote} variant="outline" className="rounded-full border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10">
                    Check Delivery
                  </Button>
                  <Button 
                    data-testid="btn-proceed-payment" 
                    disabled={!quote?.allowed || loading || !idVerified} 
                    onClick={createOrder} 
                    className={`flex-1 rounded-full font-semibold ${
                      idVerified 
                        ? 'bg-emerald-500 text-black hover:bg-emerald-400' 
                        : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                    }`}
                  >
                    {loading ? "Processing..." : !idVerified ? "Upload ID to Continue" : `Proceed to Payment — $${total.toFixed(2)}`}
                  </Button>
                </div>
                
                <p className="text-zinc-500 text-xs text-center">
                  Texas delivery only • 21+ with valid ID required at delivery • ID will be verified by courier
                </p>
              </>
            ) : (
              <>
                <h3 className="text-white font-semibold text-lg">Payment</h3>
                <div className="p-4 rounded-lg bg-zinc-900/50 border border-emerald-500/20 mb-4">
                  <div className="flex justify-between text-white mb-2">
                    <span>Order Total:</span>
                    <span className="text-xl font-bold text-emerald-400">${orderTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-zinc-400 text-sm">Order ID: {orderId?.slice(0, 8)}...</p>
                  <div className="flex items-center gap-2 mt-2 text-emerald-400 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>ID Verified</span>
                  </div>
                </div>
                
                <div className="bg-zinc-900 p-4 rounded-lg border border-emerald-500/20" data-testid="square-payment-form">
                  <PaymentForm
                    applicationId={SQUARE_APP_ID}
                    locationId={SQUARE_LOCATION_ID}
                    cardTokenizeResponseReceived={handlePaymentComplete}
                    createPaymentRequest={() => ({
                      countryCode: "US",
                      currencyCode: "USD",
                      total: {
                        amount: orderTotal.toFixed(2),
                        label: "Total",
                      },
                    })}
                  >
                    <CreditCard 
                      buttonProps={{
                        css: {
                          backgroundColor: "#10b981",
                          color: "#000",
                          "&:hover": {
                            backgroundColor: "#34d399",
                          },
                        },
                      }}
                    />
                  </PaymentForm>
                </div>
                
                <Button 
                  variant="ghost" 
                  onClick={() => setShowPayment(false)}
                  className="w-full text-zinc-400 hover:text-white"
                >
                  ← Back to delivery details
                </Button>
                
                <div className="text-center text-zinc-500 text-xs space-y-1">
                  <p>🔒 Secure payment powered by Square</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
