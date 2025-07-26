import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  HomeIcon,
  WrenchScrewdriverIcon,
  DocumentChartBarIcon,
  UserGroupIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { Wrench } from 'lucide-react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-gray-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/">
            <div className="flex items-center">
              <img src="/logo.png" alt="logo" className='h-12 w-12' />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavItem to="/" icon={<HomeIcon className="h-5 w-5" />} text="Dashboard" />
            <NavItem to="/servicing" icon={<WrenchScrewdriverIcon className="h-5 w-5" />} text="Servicing" />
            <NavItem to="/reports" icon={<DocumentChartBarIcon className="h-5 w-5" />} text="Reports" />
            <NavItem to="/loyal" icon={<UserGroupIcon className="h-5 w-5" />} text="Loyal" />
            <NavItem to="/worker" icon={<UsersIcon className="h-5 w-5" />} text="Workers" />
            <NavItem to="/maintenance" icon={<Wrench className="h-6 w-6" />} text="Expense" />
          </nav>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex items-center space-x-2 overflow-x-auto py-2 px-1">
            <MobileNavItem to="/" icon={<HomeIcon className="h-6 w-6" />} />
            <MobileNavItem to="/servicing" icon={<WrenchScrewdriverIcon className="h-6 w-6" />} />
            <MobileNavItem to="/reports" icon={<DocumentChartBarIcon className="h-6 w-6" />} />
            <MobileNavItem to="/loyal" icon={<UserGroupIcon className="h-6 w-6" />} />
            <MobileNavItem to="/worker" icon={<UsersIcon className="h-6 w-6" />} />
            <MobileNavItem to="/maintenance" icon={<Wrench className="h-6 w-6" />} />
          </nav>
        </div>
      </div>
    </header>
  );
};

// Desktop Nav Item Component
const NavItem = ({ to, icon, text }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
          ? 'bg-gray-800 text-yellow-400'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`
      }
    >
      <span className="mr-2">{icon}</span>
      {text}
    </NavLink>
  );
};

// Mobile Nav Item Component
const MobileNavItem = ({ to, icon }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center p-2 rounded-full transition-colors ${isActive
          ? 'bg-gray-800 text-yellow-400'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`
      }
    >
      {icon}
    </NavLink>
  );
};

export default Header;