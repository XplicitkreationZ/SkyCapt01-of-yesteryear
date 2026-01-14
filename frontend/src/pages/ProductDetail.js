import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Strain type colors
const STRAIN_COLORS = {
  Hybrid: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-400' },
  Sativa: { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-400' },
  Indica: { bg: 'bg-indigo-500', border: 'border-indigo-500', text: 'text-indigo-400' },
};

export default function ProductDetail({ addToCart }) {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`${API}/products/${productId}`);
        setProduct(data);
        // Auto-select first variant if available
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        
        // Fetch related products from same category
        const allProducts = await axios.get(`${API}/products`);
        const related = allProducts.data
          .filter(p => p.category === data.category && p.id !== data.id)
          .slice(0, 4);
        setRelatedProducts(related);
      } catch (e) {
        setError("Product not found");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    // Include selected variant in cart item
    const cartItem = selectedVariant 
      ? { ...product, selectedVariant: selectedVariant }
      : product;
    
    for (let i = 0; i < quantity; i++) {
      addToCart(cartItem);
    }
    const variantText = selectedVariant ? ` (${selectedVariant.name})` : '';
    toast.success(`Added ${quantity} ${product.name}${variantText} to cart`);
  };

  const incrementQty = () => setQuantity(q => q + 1);
  const decrementQty = () => setQuantity(q => Math.max(1, q - 1));

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12" data-testid="product-detail-loading">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-zinc-800 rounded mb-8"></div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="aspect-square bg-zinc-800 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-10 bg-zinc-800 rounded w-3/4"></div>
              <div className="h-6 bg-zinc-800 rounded w-1/4"></div>
              <div className="h-24 bg-zinc-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center" data-testid="product-detail-error">
        <h2 className="text-2xl text-red-400 mb-4">Product Not Found</h2>
        <Link to="/shop" className="text-emerald-400 hover:underline">
          ← Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" data-testid="product-detail-page">
      {/* Breadcrumb */}
      <nav className="mb-8" data-testid="product-breadcrumb">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Shop
        </Link>
      </nav>

      {/* Main Product Section */}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="relative" data-testid="product-image-section">
          <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-emerald-500/20">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-contain p-4"
              data-testid="product-main-image"
            />
          </div>
          {product.category && (
            <span className="absolute top-4 left-4 px-3 py-1 bg-emerald-500/90 text-black text-xs font-semibold rounded-full">
              {product.category}
            </span>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col" data-testid="product-info-section">
          {/* Brand */}
          {product.brand && (
            <span className="text-emerald-400 text-sm font-medium uppercase tracking-wider mb-2" data-testid="product-brand">
              {product.brand}
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4" data-testid="product-title">
            {product.name}
          </h1>

          {/* Price */}
          <div className="mb-6" data-testid="product-price">
            <span className="text-3xl font-bold text-emerald-400">
              ${product.price.toFixed(2)}
            </span>
          </div>

          {/* Size/Variant Info */}
          {product.size && (
            <div className="mb-6 pb-6 border-b border-zinc-800">
              <span className="text-zinc-400 text-sm">Size: </span>
              <span className="text-white font-medium">{product.size}</span>
            </div>
          )}

          {/* Strain/Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6 pb-6 border-b border-zinc-800" data-testid="variant-selector">
              <label className="text-zinc-400 text-sm block mb-3">
                Choose Your Strain: <span className="text-emerald-400">*Required</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((variant, idx) => {
                  const colors = STRAIN_COLORS[variant.type] || STRAIN_COLORS.Hybrid;
                  const isSelected = selectedVariant?.name === variant.name;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariant(variant)}
                      className={`relative px-3 py-2.5 rounded-lg text-left transition-all ${
                        isSelected 
                          ? `${colors.border} border-2 bg-zinc-800/80` 
                          : 'border border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
                      }`}
                      data-testid={`variant-${variant.name.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${colors.bg}`}></span>
                          <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                            {variant.name}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <span className={`text-xs ${colors.text} ml-5`}>{variant.type}</span>
                    </button>
                  );
                })}
              </div>
              {selectedVariant && (
                <p className="mt-3 text-sm text-zinc-400">
                  Selected: <span className="text-white font-medium">{selectedVariant.name}</span>
                  <span className={`ml-2 ${STRAIN_COLORS[selectedVariant.type]?.text || 'text-purple-400'}`}>
                    ({selectedVariant.type})
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Quantity Selector */}
          <div className="mb-6" data-testid="quantity-selector">
            <label className="text-zinc-400 text-sm block mb-3">Quantity:</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-emerald-500/30 rounded-lg overflow-hidden">
                <button
                  onClick={decrementQty}
                  className="p-3 hover:bg-emerald-500/10 transition-colors text-emerald-400"
                  data-testid="qty-decrease"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-6 py-3 text-white font-semibold min-w-[60px] text-center" data-testid="qty-value">
                  {quantity}
                </span>
                <button
                  onClick={incrementQty}
                  className="p-3 hover:bg-emerald-500/10 transition-colors text-emerald-400"
                  data-testid="qty-increase"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            className="w-full py-6 text-lg font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black transition-all transform hover:scale-[1.02]"
            data-testid="add-to-cart-btn"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add to Cart — ${(product.price * quantity).toFixed(2)}
          </Button>

          {/* Trust Badges */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              21+ Required
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Texas Delivery Only
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Fast Local Delivery
            </span>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-12" data-testid="product-tabs">
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="w-full justify-start bg-zinc-900/50 border border-emerald-500/20 rounded-lg p-1">
            <TabsTrigger 
              value="description" 
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black rounded-md px-6"
            >
              Description
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black rounded-md px-6"
            >
              Product Details
            </TabsTrigger>
            {product.coa_url && (
              <TabsTrigger 
                value="coa" 
                className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black rounded-md px-6"
              >
                COA
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="description" className="mt-6">
            <div className="bg-zinc-900/30 border border-emerald-500/10 rounded-xl p-6">
              <p className="text-zinc-300 leading-relaxed" data-testid="product-description">
                {product.description || "No description available for this product."}
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="mt-6">
            <div className="bg-zinc-900/30 border border-emerald-500/10 rounded-xl p-6">
              <dl className="grid grid-cols-2 gap-4 text-sm" data-testid="product-details-list">
                {product.brand && (
                  <>
                    <dt className="text-zinc-400">Brand</dt>
                    <dd className="text-white">{product.brand}</dd>
                  </>
                )}
                {product.category && (
                  <>
                    <dt className="text-zinc-400">Category</dt>
                    <dd className="text-white">{product.category}</dd>
                  </>
                )}
                {product.size && (
                  <>
                    <dt className="text-zinc-400">Size</dt>
                    <dd className="text-white">{product.size}</dd>
                  </>
                )}
                {product.strain_type && (
                  <>
                    <dt className="text-zinc-400">Strain Type</dt>
                    <dd className="text-white">{product.strain_type}</dd>
                  </>
                )}
              </dl>
            </div>
          </TabsContent>
          
          {product.coa_url && (
            <TabsContent value="coa" className="mt-6">
              <div className="bg-zinc-900/30 border border-emerald-500/10 rounded-xl p-6">
                <p className="text-zinc-300 mb-4">Certificate of Analysis available for this product.</p>
                <a 
                  href={product.coa_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
                >
                  View COA Document →
                </a>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16" data-testid="related-products">
          <h2 className="text-2xl font-bold text-white mb-6">Related Products</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.map(p => (
              <Link 
                key={p.id} 
                to={`/product/${p.id}`}
                className="group bg-zinc-900/50 border border-emerald-500/20 rounded-xl overflow-hidden hover:border-emerald-400/50 transition-all"
                data-testid={`related-product-${p.id}`}
              >
                <div className="aspect-square bg-zinc-800 overflow-hidden">
                  <img 
                    src={p.image_url} 
                    alt={p.name}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-white text-sm font-medium line-clamp-2 mb-2">{p.name}</h3>
                  <span className="text-emerald-400 font-semibold">${p.price.toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
