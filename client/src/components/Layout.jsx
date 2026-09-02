//import { Outlet } from 'react-router-dom';
// src/components/Layout.jsx
import React from 'react';
import Sidebar from './navigation/Sidebar'; // Adjust the path as needed
import { Outlet } from 'react-router-dom';

export default function Layout({ user }) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Sidebar on the left */}
      <Sidebar user={user} />

      {/* Add ml-64 (margin-left: 16rem / 256px) so content starts after the sidebar */}
      <main className="ml-64 p-6 min-h-screen overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}