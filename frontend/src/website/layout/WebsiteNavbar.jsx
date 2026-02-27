// src/website/layout/WebsiteNavbar.jsx - SEARCH AND DEALS REMOVED
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaBars, FaTimes } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

const WebsiteNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { cartCount } = useCart();

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold">HNJ</span>
            </div>
            <span className="text-xl font-bold text-gray-900">HNj Store</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-red-600">Home</Link>
            <Link to="/shop" className="text-gray-700 hover:text-red-600">Shop</Link>
            
            {/* Cart */}
            <Link to="/cart" className="relative">
              <FaShoppingCart className="h-6 w-6 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Admin Link */}
            <Link to="/auth" className="text-gray-500 text-sm">Log</Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700"
          >
            {isMenuOpen ? <FaTimes className="h-6 w-6" /> : <FaBars className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="flex flex-col space-y-3">
              <Link to="/" className="py-2" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link to="/shop" className="py-2" onClick={() => setIsMenuOpen(false)}>Shop</Link>
              <Link to="/cart" className="py-2 flex items-center" onClick={() => setIsMenuOpen(false)}>
                Cart ({cartCount})
              </Link>
              <Link to="/auth" className="py-2" onClick={() => setIsMenuOpen(false)}>Admin</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default WebsiteNavbar;