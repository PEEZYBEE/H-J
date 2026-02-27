// src/website/pages/ProductPage.jsx - SIMPLIFIED WITH WORKING VIDEO AND AUTOPLAY
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FaShoppingCart, FaStar, FaTruck, 
  FaShieldAlt, FaArrowLeft, FaShareAlt, FaHeart,
  FaCheck, FaTimes, FaPlus, FaMinus, FaPlay,
  FaVideo
} from 'react-icons/fa';
import { useCart } from '../context/CartContext';

// Local placeholder data URIs (no external dependencies)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'600\' height=\'600\' viewBox=\'0 0 600 600\'%3E%3Crect width=\'600\' height=\'600\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-family=\'Arial\' font-size=\'24\' fill=\'%23999\'%3ENo Image%3C/text%3E%3C/svg%3E';
const PLACEHOLDER_THUMB = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'80\' height=\'80\' viewBox=\'0 0 80 80\'%3E%3Crect width=\'80\' height=\'80\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-family=\'Arial\' font-size=\'12\' fill=\'%23999\'%3EImg%3C/text%3E%3C/svg%3E';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [mediaType, setMediaType] = useState('image');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  // Video ref for autoplay
  const videoRef = useRef(null);

  useEffect(() => {
    fetchProduct();
    fetchRelatedProducts();
  }, [id]);

  useEffect(() => {
    // Reset media selection when product changes
    if (product) {
      setSelectedMediaIndex(0);
      const mediaItems = getMediaItems();
      setMediaType(mediaItems[0]?.type || 'image');
    }
  }, [product]);

  // Auto-play video when selected
  useEffect(() => {
    if (mediaType === 'video' && videoRef.current) {
      setTimeout(() => {
        videoRef.current.play().catch(e => {
          console.log('Autoplay prevented:', e);
        });
      }, 100);
    }
  }, [selectedMediaIndex, mediaType]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      // FIXED: Using relative URL
      const response = await fetch(`/api/products/products/${id}`);
      
      if (!response.ok) {
        throw new Error('Product not found');
      }
      
      const data = await response.json();
      setProduct(data.product || data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      // FIXED: Using relative URL
      const response = await fetch(`/api/products/products?limit=4`);
      if (response.ok) {
        const data = await response.json();
        setRelatedProducts(data.products || data);
      }
    } catch (err) {
      console.error('Error fetching related products:', err);
    }
  };

  // Combine images and videos into a single media array
  const getMediaItems = () => {
    if (!product) return [];
    
    const items = [];
    
    // Add images - FIXED: Use relative URLs
    if (product.image_urls && product.image_urls.length > 0) {
      product.image_urls.forEach(url => {
        items.push({
          type: 'image',
          url: url, // Already relative from the API
          thumbnail: url
        });
      });
    }
    
    // Add videos - FIXED: Use relative URLs
    if (product.video_urls && product.video_urls.length > 0) {
      product.video_urls.forEach(url => {
        items.push({
          type: 'video',
          url: url, // Already relative from the API
          thumbnail: null
        });
      });
    }
    
    // If no media at all, add a placeholder
    if (items.length === 0) {
      items.push({
        type: 'image',
        url: PLACEHOLDER_IMAGE,
        thumbnail: PLACEHOLDER_THUMB
      });
    }
    
    return items;
  };

  const handleMediaSelect = (index) => {
    const mediaItems = getMediaItems();
    setSelectedMediaIndex(index);
    setMediaType(mediaItems[index].type);
  };

  const handleAddToCart = () => {
    if (!product || product.stock_quantity === 0) return;
    
    setIsAddingToCart(true);
    
    // Add the product with quantity
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    
    // Show success animation
    setTimeout(() => {
      setIsAddingToCart(false);
      alert(`${quantity} ${product.name}(s) added to cart!`);
    }, 500);
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stock_quantity || 10)) {
      setQuantity(newQuantity);
    }
  };

  const handleBuyNow = () => {
    if (!product || product.stock_quantity === 0) return;
    
    // Add to cart and redirect to checkout
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    navigate('/checkout');
  };

  // Calculate if product is in cart
  const cartItem = product ? cartItems.find(item => item.id === product.id) : null;
  const isInCart = !!cartItem;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/2">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:w-1/2">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-8"></div>
                <div className="h-12 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-12 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FaTimes className="text-6xl text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h1>
            <p className="text-gray-600 mb-6">
              {error || 'The product you are looking for does not exist or has been removed.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaArrowLeft /> Continue Shopping
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const mediaItems = getMediaItems();
  const currentMedia = mediaItems[selectedMediaIndex];
  const price = product.is_on_offer && product.offer_price ? product.offer_price : (product.selling_price || product.price || 0);
  const originalPrice = product.price || 0;
  const discount = product.is_on_offer && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link to="/" className="text-gray-700 hover:text-red-600">
                  Home
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <Link to="/shop" className="text-gray-700 hover:text-red-600">
                    Shop
                  </Link>
                </div>
              </li>
              {product.category_name && (
                <li>
                  <div className="flex items-center">
                    <span className="mx-2 text-gray-400">/</span>
                    <span className="text-gray-500">{product.category_name}</span>
                  </div>
                </li>
              )}
              <li aria-current="page">
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-900 font-medium truncate max-w-xs">
                    {product.name}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Media (Images & Videos) */}
          <div className="lg:w-1/2">
            {/* Main Media Display */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden relative">
                {currentMedia.type === 'image' ? (
                  <img
                    src={currentMedia.url}
                    alt={`${product.name} - Media ${selectedMediaIndex + 1}`}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                ) : (
                  <div className="relative w-full h-full bg-black">
                    <video
                      ref={videoRef}
                      src={currentMedia.url}
                      className="w-full h-full object-contain"
                      controls
                      playsInline
                      preload="auto"
                    >
                      <source src={currentMedia.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    
                    {/* Video Badge */}
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg flex items-center">
                      <FaVideo className="mr-1" /> VIDEO
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Media Thumbnails (Images & Videos) */}
            {mediaItems.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {mediaItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleMediaSelect(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden relative ${
                      selectedMediaIndex === index 
                        ? 'border-red-600 ring-2 ring-red-200' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    {item.type === 'image' ? (
                      <img
                        src={item.thumbnail}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = PLACEHOLDER_THUMB;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <FaPlay size={20} className="text-white opacity-70" />
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

          {/* Right Column - Product Info */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Product Header */}
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className="fill-current" />
                    ))}
                  </div>
                  <span className="text-gray-600">(4.5) • 128 reviews</span>
                </div>

                {/* Category */}
                {product.category_name && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-500">Category: </span>
                    <Link 
                      to={`/shop?category=${product.category_id}`}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {product.category_name}
                    </Link>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-red-600">
                    KSh {price?.toLocaleString() || '0'}
                  </span>
                  
                  {product.is_on_offer && originalPrice > price && (
                    <>
                      <span className="text-xl text-gray-400 line-through">
                        KSh {originalPrice.toLocaleString()}
                      </span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded font-bold">
                        Save {discount}%
                      </span>
                    </>
                  )}
                </div>
                
                {product.is_on_offer && product.offer_expiry && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-600">
                      Offer ends: {new Date(product.offer_expiry).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${
                  product.stock_quantity === 0 
                    ? 'bg-red-100 text-red-800' 
                    : product.stock_quantity <= 10 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {product.stock_quantity === 0 ? (
                    <>
                      <FaTimes /> Out of Stock
                    </>
                  ) : product.stock_quantity <= 10 ? (
                    <>
                      <FaCheck /> Only {product.stock_quantity} left in stock
                    </>
                  ) : (
                    <>
                      <FaCheck /> In Stock
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {product.description || 'No description available.'}
                </p>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Quantity</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaMinus />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock_quantity}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    {product.stock_quantity} available
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0 || isAddingToCart}
                  className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${
                    product.stock_quantity === 0 || isAddingToCart
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isAddingToCart ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : isInCart ? (
                    <>
                      <FaCheck /> Added to Cart
                    </>
                  ) : (
                    <>
                      <FaShoppingCart /> Add to Cart
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock_quantity === 0}
                  className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${
                    product.stock_quantity === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  }`}
                >
                  Buy Now
                </button>
                
                <button
                  className="w-12 h-12 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  title="Add to Wishlist"
                >
                  <FaHeart className="text-gray-600" />
                </button>
                
                <button
                  className="w-12 h-12 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  title="Share"
                >
                  <FaShareAlt className="text-gray-600" />
                </button>
              </div>

              {/* Product Features */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold mb-4">Product Features</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <FaTruck className="text-green-600" />
                    <div>
                      <div className="font-medium">Free Shipping</div>
                      <div className="text-sm text-gray-500">On orders over KSh 5,000</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaShieldAlt className="text-blue-600" />
                    <div>
                      <div className="font-medium">Warranty</div>
                      <div className="text-sm text-gray-500">1 year manufacturer warranty</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts
                .filter(p => p.id !== product.id)
                .slice(0, 4)
                .map(relatedProduct => (
                <div key={relatedProduct.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                  <Link to={`/product/${relatedProduct.id}`}>
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      {relatedProduct.image_urls && relatedProduct.image_urls.length > 0 ? (
                        <img 
                          src={relatedProduct.image_urls[0]} // Already relative
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = PLACEHOLDER_IMAGE;
                          }}
                        />
                      ) : relatedProduct.video_urls && relatedProduct.video_urls.length > 0 ? (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <FaVideo className="text-white text-3xl" />
                          <span className="text-white ml-2">Video</span>
                        </div>
                      ) : (
                        <img
                          src={PLACEHOLDER_IMAGE}
                          alt="No image"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                        {relatedProduct.name}
                      </h3>
                      <div className="font-bold text-red-600">
                        KSh {(relatedProduct.selling_price || relatedProduct.price || 0).toLocaleString()}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section (Placeholder) */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
            <button className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">
              Write a Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;