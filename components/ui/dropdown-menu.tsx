"use client";

import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';

const DropdownMenu = Menu;
const DropdownMenuTrigger = Menu.Button;

const DropdownMenuContent = ({ 
  children, 
  align = 'right',
  className,
  ...props 
}: { 
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) => (
  <Transition
    as={Fragment}
    enter="transition ease-out duration-100"
    enterFrom="transform opacity-0 scale-95"
    enterTo="transform opacity-100 scale-100"
    leave="transition ease-in duration-75"
    leaveFrom="transform opacity-100 scale-100"
    leaveTo="transform opacity-0 scale-95"
  >
    <Menu.Items
      className={cn(
        "absolute z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
        align === 'left' ? 'left-0' : 'right-0',
        className
      )}
      {...props}
    >
      <div className="py-1">{children}</div>
    </Menu.Items>
  </Transition>
);

const DropdownMenuItem = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <Menu.Item>
    {({ active }) => (
      <button
        className={cn(
          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
          'block w-full text-left px-4 py-2 text-sm',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )}
  </Menu.Item>
);

const DropdownMenuSeparator = () => (
  <div className="h-px bg-gray-200 my-1" />
);

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};