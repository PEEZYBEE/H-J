import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

const AppLayout = () => {
  return (
    <div className="flex h-screen w-full bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar - flush to top */}
        <Navbar />
        
        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 md:p-6 w-full">
            <Outlet />
          </div>
          
          {/* Footer - REMOVED mt-16 from here */}
          <div className="mt-auto"> {/* Push footer to bottom */}
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;