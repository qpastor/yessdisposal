import React from 'react'
import Person from '@mui/icons-material/Person';
// import Logout from '@mui/icons-material/Logout';
import RequestQuote from '@mui/icons-material/RequestQuote';
import { LayoutDashboard, ClipboardList, LogOut } from 'lucide-react';


export const SidebarData= [
    {
        title: "Dashboard",
        icon: <LayoutDashboard size={20} />,
        link: "/dashboard"
    },
    {
        title: "User Management",
        icon: <Person />,
        link: "/user-management"
    },
    {
        title: "Task List",
        icon: <ClipboardList size={20} />,
        link: "/master-list"
    //     subNav: [
    //   { title: "Task Register", link: "/task-registration" },
    //   { title: "Master List", link: "" }
    // ] //later on will be rename to task-list
    },
    {
        title: "Request List",
        icon: <RequestQuote />,
        link: "/request-list"
    },
    {
        title: "Logout",
        icon: <LogOut size={20} />,
        link: "/logout"
    },
]