'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Paintbrush,
  Home,
  Settings,
  Star,
  TrendingUp
} from 'lucide-react';

export default function AdminNav() {
  const pathname = usePathname();
  
  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: <Home className="h-4 w-4" />
    },
    {
      name: 'Artworks',
      href: '/admin/artworks',
      icon: <Paintbrush className="h-4 w-4" />
    },
    {
      name: 'Future Masters',
      href: '/admin/future-masters-artists',
      icon: <Star className="h-4 w-4" />
    },
    {
      name: 'Trending Products',
      href: '/admin/trending-products',
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: <Users className="h-4 w-4" />
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-4 w-4" />
    }
  ];
  
  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/admin" className="text-xl font-bold text-primary">
              AI Curator Admin
            </Link>
          </div>
          
          <div className="flex space-x-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span className="ml-2">{item.name}</span>
                </Link>
              );
            })}
          </div>
          
          <div>
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Return to Site
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 