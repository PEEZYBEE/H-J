// src/website/pages/HomePage.jsx - FIXED with proper price handling
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch('http://localhost:5000/api/products/products?limit=20')
      .then(res => res.json())
      .then(data => {
        // Handle both response formats
        const productsData = data.products || data;
        setProducts(productsData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setLoading(false);
      });
  }, []);

  // Helper function to safely get price
  const getProductPrice = (product) => {
    // Try selling_price first (new), then price (old), default to 0
    return product?.selling_price ?? product?.price ?? 0;
  };

  // Helper function to safely format currency
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

  const handleAddToCart = (product) => {
    addToCart(product);
    alert(`${product.name} added to cart!`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-600 to-pink-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Shop Smart, Shop HNJ</h1>
          <p className="text-xl mb-8">Where your next favourite thing lives.</p>
          <Link to="/shop" className="bg-white text-red-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100">
            Start Shopping
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-orange-600">Featured Products</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-64 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map(product => {
                const regularPrice = getProductPrice(product);
                const offerPrice = product?.offer_price ?? 0;
                
                return (
                  <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    {/* Product Image */}
                    <div className="h-48 bg-gray-100 overflow-hidden relative">
                      {product.image_urls && product.image_urls.length > 0 ? (
                        <img 
                          src={`http://localhost:5000/api/uploads/products/${product.image_urls[0]?.split('/').pop()}`}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}
                      
                      {/* OFFER Badge */}
                      {product.is_on_offer && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-2 py-1 rounded text-xs font-bold">
                          OFFER
                        </div>
                      )}
                      
                      {/* Stock Badge */}
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        product.stock_quantity === 0 
                          ? 'bg-red-100 text-red-800' 
                          : product.stock_quantity <= 10 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {product.stock_quantity === 0 
                          ? 'Out of Stock' 
                          : product.stock_quantity <= 10 
                          ? `Only ${product.stock_quantity} left` 
                          : 'In Stock'}
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{product.name}</h3>
                      
                      {/* Description */}
                      {product.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      {/* Price - FIXED: Handle undefined prices safely */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          {product.is_on_offer && product.offer_price ? (
                            <>
                              <span className="font-bold text-lg text-red-600">
                                KSh {formatCurrency(offerPrice)}
                              </span>
                              <span className="text-gray-400 text-sm line-through ml-2">
                                KSh {formatCurrency(regularPrice)}
                              </span>
                              {product.discount_percentage && (
                                <span className="text-green-600 text-sm font-bold ml-2">
                                  ({product.discount_percentage}% OFF)
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="font-bold text-lg text-red-600">
                              KSh {formatCurrency(regularPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Add to Cart Button */}
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock_quantity === 0}
                        className={`w-full py-2 rounded-lg font-medium transition-colors ${
                          product.stock_quantity === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                      
                      {/* View Details Link */}
                      <Link 
                        to={`/product/${product.id}`}
                        className="block text-center text-red-600 text-sm mt-2 hover:text-red-800"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/shop" className="text-red-600 font-bold hover:text-red-700 text-lg">
              View All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* Special Offers Section - FIXED: Handle undefined prices */}
      {products.some(p => p.is_on_offer) && (
        <section className="py-12 bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Special Offers</h2>
              <p className="text-gray-600">Limited time discounts on selected products</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.filter(p => p.is_on_offer).map(offerProduct => {
                const regularPrice = getProductPrice(offerProduct);
                const offerPrice = offerProduct?.offer_price ?? 0;
                
                return (
                  <div key={offerProduct.id} className="bg-white rounded-lg shadow p-4 flex items-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden mr-4">
                      {offerProduct.image_urls && offerProduct.image_urls.length > 0 ? (
                        <img 
                          src={`http://localhost:5000/api/uploads/products/${offerProduct.image_urls[0]?.split('/').pop()}`}
                          alt={offerProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-bold text-gray-900">{offerProduct.name}</h3>
                      <div className="flex items-center mt-2 flex-wrap">
                        <span className="font-bold text-red-600 text-lg">
                          KSh {formatCurrency(offerPrice)}
                        </span>
                        <span className="text-gray-400 text-sm line-through ml-2">
                          KSh {formatCurrency(regularPrice)}
                        </span>
                        {offerProduct.discount_percentage && (
                          <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                            Save {offerProduct.discount_percentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 font-bold text-xl">🚚</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Nairobi & major cities</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 font-bold text-xl">👤</span>
              </div>
              <h3 className="font-bold text-lg mb-2">No Account Needed</h3>
              <p className="text-gray-600">Guest checkout available</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 font-bold text-xl">💳</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Secure Payment</h3>
              <p className="text-gray-600">M-Pesa, Cards & Cash</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;