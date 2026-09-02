
import React from 'react';
import Person from '@mui/icons-material/Person';
import RequestQuote from '@mui/icons-material/RequestQuote';
import { LayoutDashboard, ClipboardList, LogOut } from 'lucide-react';

export const SidebarData = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard size={20} />,
    link: "/dashboard",
    permission: "view:dashboard"
  },
  {
    title: "User Management",
    icon: <Person />,
    link: "/user-management",
    permission: "view:user-management"
  },
  {
    title: "Master List",
    icon: <ClipboardList size={20} />,
    link: "/master-list",
    permission: "view:master-list"
  },
  {
    title: "Request List",
    icon: <RequestQuote />,
    link: "/request-list",
    permission: "view:request-list"
  },
  {
    title: "Reports",
    icon: <LayoutDashboard size={20} />,
    link: "/reports",
    permission: "view:reports"
  },
  {
    title: "Logout",
    icon: <LogOut size={20} />,
    link: "/logout"
    // No permission needed: visible to all logged-in users
  },
];