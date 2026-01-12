import { ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 p-6 lg:p-8 ml-0 lg:ml-64 mt-16">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
};

export default Layout;