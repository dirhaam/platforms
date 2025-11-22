'use client';

import React from 'react';
import { Search, Globe, Moon, Grid, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Navbar() {
    return (
        <header className="px-6 py-3 sticky top-0 z-40 bg-background/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-sm px-6 h-16 flex items-center justify-between">
                {/* Search */}
                <div className="flex items-center gap-3 flex-1">
                    <Search className="text-gray-400 w-5 h-5" />
                    <Input
                        type="text"
                        placeholder="Search..."
                        className="w-full max-w-md bg-transparent border-none shadow-none focus-visible:ring-0 text-muted-foreground placeholder:text-gray-400"
                    />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Globe className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Moon className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Grid className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border border-white"></span>
                        </Button>
                    </div>

                    {/* Profile */}
                    <div className="relative cursor-pointer">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm relative">
                            <img
                                src="https://picsum.photos/seed/admin/100"
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
