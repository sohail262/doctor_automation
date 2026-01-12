import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    footer?: ReactNode;
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
};

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    footer,
}: ModalProps) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className={`relative bg-dark-900 rounded-xl shadow-xl border border-dark-700 w-full ${sizeClasses[size]} transform transition-all`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
                        <h2 className="text-lg font-semibold text-dark-100">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-1 text-dark-400 hover:text-dark-100 rounded-lg hover:bg-dark-800 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">{children}</div>

                    {/* Footer */}
                    {footer && (
                        <div className="flex items-center justify-end px-6 py-4 border-t border-dark-700 space-x-3">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;