import { ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="min-h-screen bg-dark-950">
            <Sidebar />
            <div className="lg:pl-64">
                <Navbar />
                <main className="p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
};

export default Layout;