import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaTwitter, 
  FaFacebook, 
  FaInstagram, 
  FaEnvelope, 
  FaPhone,
  FaGithub,
  FaLinkedin,
  FaStore,
  FaBoxOpen,
  FaChartLine,
  FaUserFriends
} from 'react-icons/fa';

const Footer = () => {
  const isLoggedIn = !!localStorage.getItem('token');
  const currentYear = new Date().getFullYear();
  
  // Get user role for conditional links
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'guest';

  return (
    <footer className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] text-white py-10 ">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-red-600">HNj</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">HNj Store</h2>
                <p className="text-sm text-red-100">Inventory Management System</p>
              </div>
            </div>
            <p className="text-sm text-white/90 leading-relaxed">
              A comprehensive inventory and sales management solution for businesses of all sizes. 
              Streamline your operations with our powerful tools.
            </p>
            <div className="flex space-x-4 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-all duration-300 transform hover:scale-110 hover:rotate-3"
                title="GitHub"
              >
                <FaGithub size={22} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-all duration-300 transform hover:scale-110 hover:rotate-3"
                title="Twitter"
              >
                <FaTwitter size={22} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-all duration-300 transform hover:scale-110 hover:rotate-3"
                title="LinkedIn"
              >
                <FaLinkedin size={22} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-all duration-300 transform hover:scale-110 hover:rotate-3"
                title="Facebook"
              >
                <FaFacebook size={22} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center">
              <FaStore className="mr-2" />
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <NavLink
                  to="/dashboard"
                  className="hover:text-white transition-colors duration-300 text-sm flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-white mr-0 group-hover:mr-2 transition-all duration-300"></span>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/products"
                  className="hover:text-white transition-colors duration-300 text-sm flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-white mr-0 group-hover:mr-2 transition-all duration-300"></span>
                  Products
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/inventory"
                  className="hover:text-white transition-colors duration-300 text-sm flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-white mr-0 group-hover:mr-2 transition-all duration-300"></span>
                  Inventory
                </NavLink>
              </li>
              {isLoggedIn ? (
                <li>
                  <NavLink
                    to="/settings"
                    className="hover:text-white transition-colors duration-300 text-sm flex items-center group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-white mr-0 group-hover:mr-2 transition-all duration-300"></span>
                    Settings
                  </NavLink>
                </li>
              ) : (
                <li>
                  <NavLink
                    to="/auth"
                    className="hover:text-white transition-colors duration-300 text-sm flex items-center group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-white mr-0 group-hover:mr-2 transition-all duration-300"></span>
                    Login / Register
                  </NavLink>
                </li>
              )}
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center">
              <FaBoxOpen className="mr-2" />
              Features
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center text-sm">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Inventory Tracking
              </li>
              <li className="flex items-center text-sm">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Sales Management
              </li>
              <li className="flex items-center text-sm">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Customer Management
              </li>
              <li className="flex items-center text-sm">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Reports & Analytics
              </li>
              <li className="flex items-center text-sm">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                Multi-role Access
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center">
              <FaUserFriends className="mr-2" />
              Contact Us
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 group cursor-pointer">
                <div className="mt-1">
                  <FaEnvelope className="text-white/80 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a 
                    href="mailto:support@hnjstore.com" 
                    className="text-sm text-white/90 hover:text-white transition-colors"
                  >
                    support@hnjstore.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 group cursor-pointer">
                <div className="mt-1">
                  <FaPhone className="text-white/80 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <a 
                    href="tel:+254712345678" 
                    className="text-sm text-white/90 hover:text-white transition-colors"
                  >
                    +254 712 345 678
                  </a>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-sm font-medium mb-2">Business Hours</p>
                <p className="text-sm text-white/90">Mon - Fri: 8:00 AM - 6:00 PM</p>
                <p className="text-sm text-white/90">Sat: 9:00 AM - 4:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-white/80">
                &copy; {currentYear} <span className="font-bold">HNj Store Management System</span>. All rights reserved.
              </p>
              <p className="text-xs text-white/60 mt-1">
                Version 1.0.0 • Backend: Flask + PostgreSQL • Frontend: React + Vite
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="#" 
                className="text-sm hover:text-white transition-colors text-white/80 hover:text-white"
              >
                Privacy Policy
              </a>
              <span className="text-white/40">•</span>
              <a 
                href="#" 
                className="text-sm hover:text-white transition-colors text-white/80 hover:text-white"
              >
                Terms of Service
              </a>
              <span className="text-white/40">•</span>
              <a 
                href="#" 
                className="text-sm hover:text-white transition-colors text-white/80 hover:text-white"
              >
                Help Center
              </a>
              <span className="text-white/40">•</span>
              <a 
                href="#" 
                className="text-sm hover:text-white transition-colors text-white/80 hover:text-white"
              >
                Contact Support
              </a>
            </div>
          </div>
          
          {/* System Status */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">System Status: All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;