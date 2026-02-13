// src/website/layout/WebsiteLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import WebsiteNavbar from './WebsiteNavbar';
import WebsiteFooter from './WebsiteFooter';

const WebsiteLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <WebsiteNavbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <WebsiteFooter />
    </div>
  );
};

export default WebsiteLayout;