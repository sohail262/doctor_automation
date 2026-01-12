import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Navbar = () => {
    const { user, doctor, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
    };

    return (
        <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <button
                            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <Link to="/" className="flex items-center space-x-2 ml-2 lg:ml-0">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">D</span>
                            </div>
                            <span className="font-semibold text-xl text-gray-900">DocAuto</span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                            >
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                    <User size={18} className="text-primary-600" />
                                </div>
                                <span className="hidden sm:block text-sm font-medium text-gray-700">
                                    {doctor?.name || user?.email}
                                </span>
                            </button>

                            {profileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
                                    <Link
                                        to="/settings"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        onClick={() => setProfileDropdownOpen(false)}
                                    >
                                        Settings
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2"
                                    >
                                        <LogOut size={16} />
                                        <span>Logout</span>
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