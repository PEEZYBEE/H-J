// src/website/pages/ProductDetailPage.jsx - WITH AUTOPLAY
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { 
  ArrowLeft, ShoppingCart, Heart, Share2, Truck, Shield, 
  CheckCircle, Clock, Package, Star, Users, Zap, Tag, 
  Award, CreditCard, Smartphone, Store, Headphones, Video,
  Play
} from 'lucide-react';

// Local placeholder data URIs (no external dependencies)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'600\' height=\'600\' viewBox=\'0 0 600 600\'%3E%3Crect width=\'600\' height=\'600\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-family=\'Arial\' font-size=\'24\' fill=\'%23999\'%3ENo Image%3C/text%3E%3C/svg%3E';
const PLACEHOLDER_THUMB = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\' viewBox=\'0 0 80 80\'%3E%3Crect width=\'80\' height=\'80\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-family=\'Arial\' font-size=\'12\' fill=\'%23999\'%3EImg%3C/text%3E%3C/svg%3E';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(0);
  const [mediaType, setMediaType] = useState('image');
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [viewCount, setViewCount] = useState(Math.floor(Math.random() * 100) + 50);
  const [purchasedCount, setPurchasedCount] = useState(Math.floor(Math.random() * 500) + 100);
  const [activeTab, setActiveTab] = useState('description');
  
  // Refs for video elements
  const videoRef = useRef(null);

  // ============ HELPER FUNCTIONS FOR SAFE PRICE HANDLING ============
  
  const getProductPrice = (product) => {
    if (!product) return 0;
    if (product.is_on_offer && product.offer_price) {
      return parseFloat(product.offer_price) || 0;
    }
    if (product.selling_price) {
      return parseFloat(product.selling_price) || 0;
    }
    if (product.price) {
      return parseFloat(product.price) || 0;
    }
    return 0;
  };

  const getRegularPrice = (product) => {
    if (!product) return 0;
    if (product.selling_price) {
      return parseFloat(product.selling_price) || 0;
    }
    if (product.price) {
      return parseFloat(product.price) || 0;
    }
    return 0;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') {
      return '0.00';
    }
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const calculateSavings = (product) => {
    if (!product || !product.is_on_offer) return 0;
    const regular = getRegularPrice(product);
    const current = getProductPrice(product);
    return Math.max(0, regular - current);
  };

  // Combine images and videos into a single media array
  const getMediaItems = () => {
    const items = [];
    
    // Add images - FIXED: Use relative URLs
    if (product?.image_urls && product.image_urls.length > 0) {
      product.image_urls.forEach(url => {
        items.push({
          type: 'image',
          url: url, // Already relative from the API
          thumbnail: url
        });
      });
    }
    
    // Add videos - FIXED: Use relative URLs
    if (product?.video_urls && product.video_urls.length > 0) {
      product.video_urls.forEach(url => {
        items.push({
          type: 'video',
          url: url, // Already relative from the API
          thumbnail: null
        });
      });
    }
    
    return items;
  };

  useEffect(() => {
    fetchProduct();
    fetchRelatedProducts();
    const timer = setTimeout(() => {
      setViewCount(prev => prev + 1);
    }, 3000);
    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    // Reset selected media when product changes
    if (product) {
      setSelectedMedia(0);
      const mediaItems = getMediaItems();
      setMediaType(mediaItems[0]?.type || 'image');
    }
  }, [product]);

  // Auto-play video when selected
  useEffect(() => {
    if (mediaType === 'video' && videoRef.current) {
      // Small delay to ensure video is ready
      setTimeout(() => {
        videoRef.current.play().catch(e => {
          console.log('Autoplay prevented:', e);
          // User will need to click play - that's fine
        });
      }, 100);
    }
  }, [selectedMedia, mediaType]);

  const fetchProduct = async () => {
    try {
      // FIXED: Using relative URL (already correct)
      const response = await fetch(`/api/products/products/${id}`);
      const data = await response.json();
      console.log('Product data:', data.product || data);
      setProduct(data.product || data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      // FIXED: Using relative URL (already correct)
      const response = await fetch(`/api/products/products?limit=6`);
      const data = await response.json();
      setRelatedProducts(data.products || data);
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const handleMediaSelect = (index) => {
    const mediaItems = getMediaItems();
    setSelectedMedia(index);
    setMediaType(mediaItems[index].type);
  };

  const handleAddToCart = () => {
    if (product && product.stock_quantity > 0) {
      addToCart({ ...product, quantity });
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center animate-slide-in';
      notification.innerHTML = `
        <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <div>
          <p class="font-bold">Added to Cart!</p>
          <p class="text-sm">${quantity} × ${product.name}</p>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
      
      setPurchasedCount(prev => prev + 1);
    }
  };

  const handleBuyNow = () => {
    if (product && product.stock_quantity > 0) {
      handleAddToCart();
      setTimeout(() => navigate('/cart'), 500);
    }
  };

  const handleAddToWishlist = () => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-pink-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center animate-slide-in';
    notification.innerHTML = `
      <svg class="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
      </svg>
      <div>
        <p class="font-bold">Saved to Wishlist!</p>
        <p class="text-sm">You'll be notified about price drops</p>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const handleShare = () => {
    const currentPrice = product ? getProductPrice(product) : 0;
    
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: `Check out ${product?.name} on HNJ Store - Only KSh ${formatCurrency(currentPrice)}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center animate-slide-in';
      notification.innerHTML = `
        <svg class="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
        </svg>
        <div>
          <p class="font-bold">Link Copied!</p>
          <p class="text-sm">Share with friends & family</p>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Link to="/shop" className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const mediaItems = getMediaItems();
  const currentMedia = mediaItems[selectedMedia] || { type: 'image', url: PLACEHOLDER_IMAGE };
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 3) + 2);
  const deliveryDateStr = deliveryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const rating = (Math.random() * 0.5 + 4.5).toFixed(1);
  const reviewCount = Math.floor(Math.random() * 200) + 50;
  const currentPrice = getProductPrice(product);
  const regularPrice = getRegularPrice(product);
  const savings = calculateSavings(product);
  const hasOffer = product.is_on_offer && currentPrice < regularPrice;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-red-600">Home</Link>
            <span className="text-gray-400">/</span>
            <Link to="/shop" className="text-gray-500 hover:text-red-600">Shop</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-800 font-medium truncate">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-red-600 mb-6 group"
        >
          <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Products</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Media (Images & Videos) - WITH AUTOPLAY */}
          <div>
            <div className="bg-black/5 rounded-xl overflow-hidden mb-4 relative group">
              {/* Main Media Display */}
              {currentMedia.type === 'image' ? (
                <img
                  src={currentMedia.url}
                  alt={product.name}
                  className="w-full h-96 object-contain bg-white"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = PLACEHOLDER_IMAGE;
                  }}
                />
              ) : (
                <div className="w-full bg-black" style={{ height: '384px' }}>
                  <video
                    ref={videoRef}
                    src={currentMedia.url}
                    className="w-full h-full"
                    controls
                    playsInline
                    preload="auto"
                    style={{ objectFit: 'contain' }}
                  >
                    <source src={currentMedia.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg flex items-center">
                    <Video size={16} className="mr-1" />
                    VIDEO
                  </div>
                </div>
              )}
              
              {/* Product Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {hasOffer && (
                  <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                    <div className="flex items-center">
                      <Tag size={14} className="mr-1" />
                      {product.discount_percentage ? `${product.discount_percentage}% OFF` : 'SPECIAL OFFER'}
                    </div>
                  </div>
                )}
                {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                  <div className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                    <div className="flex items-center">
                      <Zap size={14} className="mr-1" />
                      SELLING FAST!
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Media Thumbnails (Images & Videos) */}
            {mediaItems.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {mediaItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleMediaSelect(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all relative ${
                      selectedMedia === index 
                        ? 'border-red-600 ring-2 ring-red-200 scale-105' 
                        : 'border-gray-200 hover:border-red-400'
                    }`}
                  >
                    {item.type === 'image' ? (
                      <img
                        src={item.thumbnail}
                        alt={`${product.name} view ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = PLACEHOLDER_THUMB;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <Play size={20} className="text-white opacity-70" />
                        <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-[8px] text-center py-0.5">
                          VIDEO
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info - Rest remains exactly the same */}
          <div className="space-y-6">
            {/* Product Header */}
            <div>
              {/* Stock Status */}
              <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold mb-3 ${
                product.stock_quantity === 0
                  ? 'bg-red-100 text-red-700'
                  : product.stock_quantity <= 10
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {product.stock_quantity === 0
                  ? '🚫 OUT OF STOCK'
                  : product.stock_quantity <= 10
                  ? `⚡ ONLY ${product.stock_quantity} LEFT IN STOCK`
                  : '✅ IN STOCK'}
              </div>

              {/* Product Name */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

              {/* Ratings & Social Proof */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <div className="flex text-amber-400 mr-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} fill="currentColor" className={i < Math.floor(rating) ? '' : 'text-gray-300'} />
                    ))}
                  </div>
                  <span className="font-bold text-gray-900">{rating}</span>
                  <span className="text-gray-500 ml-1">({reviewCount} reviews)</span>
                </div>
                <div className="text-gray-500">
                  <Users size={16} className="inline mr-1" />
                  <span>{viewCount.toLocaleString()} people viewed</span>
                </div>
                <div className="text-gray-500">
                  <ShoppingCart size={16} className="inline mr-1" />
                  <span>{purchasedCount.toLocaleString()} bought</span>
                </div>
              </div>

              {/* SKU */}
              <p className="text-gray-500 text-sm">
                <span className="font-medium">Product Code:</span> {product.sku || 'N/A'}
              </p>
            </div>

            {/* Price Section */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border">
              {hasOffer ? (
                <div className="space-y-3">
                  <div className="flex items-end flex-wrap">
                    <span className="text-4xl font-bold text-red-600">
                      KSh {formatCurrency(currentPrice)}
                    </span>
                    <span className="text-xl text-gray-400 line-through ml-3">
                      KSh {formatCurrency(regularPrice)}
                    </span>
                    {savings > 0 && (
                      <span className="ml-3 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                        Save KSh {formatCurrency(savings)}
                      </span>
                    )}
                  </div>
                  {product.discount_percentage && (
                    <div className="flex items-center text-green-600">
                      <Tag size={18} className="mr-2" />
                      <span className="font-bold">{product.discount_percentage}% discount applied</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-4xl font-bold text-gray-900">
                    KSh {formatCurrency(currentPrice)}
                  </span>
                </div>
              )}
            </div>

            {/* Delivery Information */}
            <div className="bg-white border rounded-xl p-5">
              <h3 className="font-bold text-lg mb-3 flex items-center text-gray-900">
                <Truck className="text-red-600 mr-2" size={20} />
                Delivery & Returns
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <CheckCircle size={18} className="text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Free Delivery</p>
                    <p className="text-sm text-gray-600">Order above KSh 2,000 for free delivery in Nairobi</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock size={18} className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Estimated Delivery</p>
                    <p className="text-sm text-gray-600">
                      <span className="text-green-600 font-bold">{deliveryDateStr}</span> - Order within next 6 hours
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Package size={18} className="text-purple-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Pickup Available</p>
                    <p className="text-sm text-gray-600">Collect from our stores in Nairobi CBD for free</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity & Actions */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border-2 border-gray-200 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-5 py-3 text-gray-600 hover:text-red-600 hover:bg-gray-50"
                      disabled={product.stock_quantity === 0}
                    >
                      −
                    </button>
                    <span className="px-6 py-3 border-x text-lg font-bold text-gray-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      className="px-5 py-3 text-gray-600 hover:text-red-600 hover:bg-gray-50"
                      disabled={product.stock_quantity === 0}
                    >
                      +
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{product.stock_quantity}</span> units available
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock_quantity === 0}
                  className={`py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                    product.stock_quantity === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  BUY NOW
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0}
                  className={`py-4 px-6 rounded-xl font-bold text-lg border-2 transition-all ${
                    product.stock_quantity === 0
                      ? 'border-gray-300 text-gray-500 cursor-not-allowed'
                      : 'border-red-600 text-red-600 hover:bg-red-50 hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  <ShoppingCart size={22} className="inline mr-2" />
                  ADD TO CART
                </button>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAddToWishlist}
                  className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:border-pink-500 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                >
                  <Heart size={20} className="inline mr-2" />
                  Save for Later
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Share2 size={20} className="inline mr-2" />
                  Share
                </button>
              </div>
            </div>

            {/* Trust & Safety Features */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
              <h3 className="font-bold text-lg mb-3 flex items-center text-gray-900">
                <Shield className="text-blue-600 mr-2" size={20} />
                Safe & Secure Shopping
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center text-gray-800">
                  <Award size={16} className="text-green-600 mr-2" />
                  <span className="text-sm">Genuine Products</span>
                </div>
                <div className="flex items-center text-gray-800">
                  <CreditCard size={16} className="text-purple-600 mr-2" />
                  <span className="text-sm">Secure Payment</span>
                </div>
                <div className="flex items-center text-gray-800">
                  <Smartphone size={16} className="text-orange-600 mr-2" />
                  <span className="text-sm">M-Pesa Verified</span>
                </div>
                <div className="flex items-center text-gray-800">
                  <Store size={16} className="text-red-600 mr-2" />
                  <span className="text-sm">Official Store</span>
                </div>
              </div>
            </div>

            {/* Customer Support */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Headphones size={20} className="text-gray-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Need help?</p>
                  <p className="text-sm text-gray-600">
                    Call us at <span className="font-bold">0712 345 678</span> or chat with us
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description & Specs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
          <div className="border-b">
            <div className="flex space-x-6">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-3 font-medium border-b-2 ${activeTab === 'description' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500'}`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('specifications')}
                className={`pb-3 font-medium border-b-2 ${activeTab === 'specifications' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500'}`}
              >
                Specifications
              </button>
            </div>
          </div>
          
          <div className="pt-6">
            {activeTab === 'description' ? (
              <div className="prose max-w-none">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Product Details</h3>
                <p className="text-gray-700 mb-6">{product.description || 'No description available.'}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div>
                    <h4 className="font-bold mb-3 text-gray-900">Key Features</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckCircle size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Premium quality materials</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">1-year manufacturer warranty</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Official Kenya distribution</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold mb-6 text-gray-900">Technical Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {product.specifications && Object.keys(product.specifications).length > 0 ? (
                    Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex border-b pb-3">
                        <span className="text-gray-600 flex-1 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-medium text-gray-900 flex-1">{value}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No specifications available for this product.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Customers Also Viewed</h2>
              <Link to="/shop" className="text-red-600 hover:text-red-700 font-medium">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts
                .filter(p => p.id !== product.id)
                .slice(0, 4)
                .map(relatedProduct => {
                  const relatedCurrentPrice = getProductPrice(relatedProduct);
                  const relatedRegularPrice = getRegularPrice(relatedProduct);
                  const relatedHasOffer = relatedProduct.is_on_offer && relatedCurrentPrice < relatedRegularPrice;
                  const relatedSavings = calculateSavings(relatedProduct);
                  
                  return (
                    <Link
                      key={relatedProduct.id}
                      to={`/product/${relatedProduct.id}`}
                      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                    >
                      <div className="h-56 bg-gray-100 overflow-hidden relative">
                        {relatedProduct.image_urls && relatedProduct.image_urls.length > 0 ? (
                          <img
                            src={relatedProduct.image_urls[0]} // Already relative
                            alt={relatedProduct.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = PLACEHOLDER_IMAGE;
                            }}
                          />
                        ) : relatedProduct.video_urls && relatedProduct.video_urls.length > 0 ? (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <Video className="text-white mr-2" size={24} />
                            <span className="text-white">Video</span>
                          </div>
                        ) : (
                          <img
                            src={PLACEHOLDER_IMAGE}
                            alt="No image"
                            className="w-full h-full object-cover"
                          />
                        )}
                        {relatedHasOffer && (
                          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                            OFFER
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600">
                          {relatedProduct.name}
                        </h3>
                        <div className="space-y-1">
                          {relatedHasOffer ? (
                            <>
                              <div className="flex items-center flex-wrap">
                                <span className="font-bold text-red-600 text-lg">
                                  KSh {formatCurrency(relatedCurrentPrice)}
                                </span>
                                <span className="text-gray-400 text-sm line-through ml-2">
                                  KSh {formatCurrency(relatedRegularPrice)}
                                </span>
                              </div>
                              {relatedSavings > 0 && (
                                <div className="text-xs text-green-600 font-medium">
                                  Save KSh {formatCurrency(relatedSavings)}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="font-bold text-red-600 text-lg">
                              KSh {formatCurrency(relatedCurrentPrice)}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          ⭐ {(Math.random() * 0.5 + 4.5).toFixed(1)} • {Math.floor(Math.random() * 200) + 50} reviews
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}

        {/* Recently Viewed (Mock) */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4 text-gray-900">Recently Viewed</h3>
          <p className="text-gray-600">Sign in to see your recently viewed items across all your devices.</p>
          <button className="mt-4 bg-white border-2 border-red-600 text-red-600 px-6 py-2 rounded-lg hover:bg-red-50 font-medium">
            Sign In to View History
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;