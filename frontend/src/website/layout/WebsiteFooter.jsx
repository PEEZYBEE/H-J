// src/website/layout/WebsiteFooter.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const WebsiteFooter = () => {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">HNj Store</h3>
            <p className="text-gray-400">Fast, simple shopping with guest checkout.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/shop" className="text-gray-400 hover:text-white">Shop</Link></li>
              <li><Link to="/deals" className="text-gray-400 hover:text-white">Deals</Link></li>
              <li><Link to="/track-order" className="text-gray-400 hover:text-white">Track Order</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <p className="text-gray-400">Nairobi, Kenya</p>
            <p className="text-gray-400">support@hnjstore.com</p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} HNj Store. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default WebsiteFooter;