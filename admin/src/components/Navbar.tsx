import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Bell,
    Search,
    Menu,
    X,
    ChevronDown,
    User,
    Settings,
    LogOut,
    Moon,
    Sun,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const Navbar = () => {
    const { adminUser, logout } = useAdminAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileDropdown, setProfileDropdown] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    // Mock notifications
    const notifications = [
        { id: 1, title: 'High error rate detected', time: '5 min ago', type: 'error' },
        { id: 2, title: 'New doctor registered', time: '1 hour ago', type: 'info' },
        { id: 3, title: 'Workflow completed', time: '2 hours ago', type: 'success' },
    ];

    return (
        <nav className="sticky top-0 z-40 bg-dark-900/80 backdrop-blur-lg border-b border-dark-800">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Mobile menu button */}
                    <button
                        className="lg:hidden p-2 text-dark-400 hover:text-dark-100"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Search */}
                    <div className="flex-1 max-w-lg mx-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search doctors, workflows, logs..."
                                className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-dark-500 bg-dark-700 rounded">
                                ⌘K
                            </kbd>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center space-x-4">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setNotificationsOpen(!notificationsOpen)}
                                className="p-2 text-dark-400 hover:text-dark-100 relative"
                            >
                                <Bell size={20} />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            {notificationsOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-dark-800 rounded-lg shadow-lg border border-dark-700 py-2">
                                    <div className="px-4 py-2 border-b border-dark-700">
                                        <h3 className="text-sm font-semibold text-dark-100">Notifications</h3>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                className="px-4 py-3 hover:bg-dark-700 cursor-pointer"
                                            >
                                                <p className="text-sm text-dark-100">{notif.title}</p>
                                                <p className="text-xs text-dark-500 mt-1">{notif.time}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-4 py-2 border-t border-dark-700">
                                        <Link
                                            to="/logs"
                                            className="text-sm text-primary-400 hover:text-primary-300"
                                        >
                                            View all notifications
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileDropdown(!profileDropdown)}
                                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-dark-800"
                            >
                                <div className="w-8 h-8 bg-primary-600/30 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-primary-400">
                                        {adminUser?.displayName?.charAt(0) || 'A'}
                                    </span>
                                </div>
                                <ChevronDown size={16} className="text-dark-400" />
                            </button>

                            {profileDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-lg shadow-lg border border-dark-700 py-1">
                                    <div className="px-4 py-2 border-b border-dark-700">
                                        <p className="text-sm font-medium text-dark-100">
                                            {adminUser?.displayName}
                                        </p>
                                        <p className="text-xs text-dark-400">{adminUser?.email}</p>
                                    </div>
                                    <Link
                                        to="/settings"
                                        className="flex items-center px-4 py-2 text-sm text-dark-300 hover:bg-dark-700"
                                        onClick={() => setProfileDropdown(false)}
                                    >
                                        <Settings size={16} className="mr-2" />
                                        Settings
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-dark-700"
                                    >
                                        <LogOut size={16} className="mr-2" />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;