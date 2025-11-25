'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { BoxIcon } from '@/components/ui/box-icon';

export function Navbar() {
    const router = useRouter();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'New Booking', message: 'You have a new booking from John Doe', time: '5m ago', read: false },
        { id: 2, title: 'Payment Received', message: 'Payment of Rp 150.000 received', time: '1h ago', read: false },
        { id: 3, title: 'System Update', message: 'System maintenance scheduled for tonight', time: '5h ago', read: true },
    ]);

    // Mock user data (replace with actual auth hook later)
    const user = {
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'Owner',
        avatar: 'https://picsum.photos/seed/admin/100',
    };

    const handleLogout = () => {
        router.push('/auth/login');
    };

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="px-6 py-3 sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/40">
            <div className="flex items-center justify-between h-16">
                {/* Search */}
                <div className="flex items-center gap-4 flex-1 max-w-xl">
                    <div className="relative w-full">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <BoxIcon name="search" size={16} className="opacity-50" />
                        </span>
                        <Input
                            type="text"
                            placeholder="Search bookings, customers, services..."
                            className="w-full pl-10 bg-muted/50 border-transparent focus:bg-background focus:border-primary/20 transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Language Selector */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                <BoxIcon name="globe" size={20} className="opacity-70" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>English</DropdownMenuItem>
                            <DropdownMenuItem>Bahasa Indonesia</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Theme Toggle */}
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
                        {isDarkMode ? (
                            <BoxIcon name="moon" size={20} className="opacity-70" />
                        ) : (
                            <BoxIcon name="sun" size={20} className="opacity-70" />
                        )}
                    </Button>

                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                                <BoxIcon name="bell" size={20} className="opacity-70" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full ring-2 ring-background animate-pulse"></span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel className="flex justify-between items-center">
                                <span>Notifications</span>
                                {unreadCount > 0 && <Badge variant="secondary" className="text-xs">{unreadCount} New</Badge>}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-[300px] overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map((notification) => (
                                        <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 cursor-pointer">
                                            <div className="flex justify-between w-full mb-1">
                                                <span className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {notification.title}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{notification.time}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                        </DropdownMenuItem>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No notifications
                                    </div>
                                )}
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="justify-center text-primary font-medium cursor-pointer">
                                View All Notifications
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User Profile */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-2">
                                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                                <BoxIcon name="user" size={16} className="mr-2 opacity-70" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <BoxIcon name="cog" size={16} className="mr-2 opacity-70" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <BoxIcon name="credit-card" size={16} className="mr-2 opacity-70" />
                                <span>Billing</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                                <BoxIcon name="log-out" size={16} className="mr-2 opacity-70" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
