import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Workflow,
    ScrollText,
    BarChart3,
    Settings,
    Key,
    Activity,
    Shield,
    HelpCircle,
    LogOut,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
    { name: 'Doctors', href: '/doctors', icon: Users, permission: 'doctors.view' },
    { name: 'Workflows', href: '/workflows', icon: Workflow, permission: 'workflows.view' },
    { name: 'Logs', href: '/logs', icon: ScrollText, permission: 'logs.view' },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, permission: 'analytics.view' },
    { name: 'System Health', href: '/system', icon: Activity, permission: 'system.view' },
    { name: 'API Keys', href: '/api-keys', icon: Key, permission: 'settings.view' },
    { name: 'Settings', href: '/settings', icon: Settings, permission: 'settings.view' },
];

const Sidebar = () => {
    const location = useLocation();
    const { adminUser, hasPermission, logout } = useAdminAuth();

    const filteredNav = navigation.filter(
        (item) =>
            !item.permission ||
            hasPermission(item.permission.split('.')[0], item.permission.split('.')[1])
    );

    return (
        <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
            <div className="flex flex-col flex-grow bg-dark-900 border-r border-dark-800 pt-5 pb-4 overflow-y-auto">
                {/* Logo */}
                <div className="flex items-center flex-shrink-0 px-4 mb-8">
                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-3">
                        <p className="text-lg font-semibold text-white">Admin</p>
                        <p className="text-xs text-dark-400">Doctor Automation</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1">
                    {filteredNav.map((item) => {
                        const isActive = location.pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
                                        ? 'bg-primary-600/20 text-primary-400'
                                        : 'text-dark-300 hover:bg-dark-800 hover:text-dark-100'
                                    }`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-400' : 'text-dark-500 group-hover:text-dark-400'
                                        }`}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Info */}
                <div className="flex-shrink-0 px-3 mt-6">
                    <div className="p-3 bg-dark-800 rounded-lg">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-primary-600/30 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-400">
                                    {adminUser?.displayName?.charAt(0) || 'A'}
                                </span>
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                                <p className="text-sm font-medium text-dark-100 truncate">
                                    {adminUser?.displayName || 'Admin'}
                                </p>
                                <p className="text-xs text-dark-400 truncate capitalize">
                                    {adminUser?.role?.replace('_', ' ') || 'Admin'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="mt-3 w-full flex items-center justify-center px-3 py-2 text-sm text-dark-400 hover:text-dark-100 hover:bg-dark-700 rounded-lg transition-colors"
                        >
                            <LogOut size={16} className="mr-2" />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Help */}
                <div className="flex-shrink-0 px-3 mt-4">
                    <a
                        href="#"
                        className="flex items-center px-3 py-2 text-sm text-dark-400 hover:text-dark-100 rounded-lg"
                    >
                        <HelpCircle size={18} className="mr-2" />
                        Help & Documentation
                    </a>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;