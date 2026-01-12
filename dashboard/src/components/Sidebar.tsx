import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    Calendar,
    MessageSquare,
    Settings,
    Activity,
    Globe,
    Share2,
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Posts', href: '/posts', icon: FileText },
    { name: 'Appointments', href: '/appointments', icon: Calendar },
    { name: 'Reviews', href: '/reviews', icon: MessageSquare },
    { name: 'GMB Settings', href: '/gmb', icon: Globe },
    { name: 'Social Media', href: '/social', icon: Share2 },
    { name: 'Logs', href: '/logs', icon: Activity },
    { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar = () => {
    const location = useLocation();

    return (
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <nav className="mt-5 flex-1 px-3 space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                                        }`}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="flex-shrink-0 p-4 border-t border-gray-200">
                <div className="bg-primary-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-primary-900">Need help?</p>
                    <p className="text-xs text-primary-700 mt-1">Contact support</p>
                    <button className="mt-3 w-full btn-primary text-xs py-1.5">Get Support</button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;