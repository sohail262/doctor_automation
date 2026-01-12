import { AlertTriangle, Trash2, Info } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    loading = false,
}: ConfirmDialogProps) => {
    const icons = {
        danger: <Trash2 className="text-red-400" size={24} />,
        warning: <AlertTriangle className="text-yellow-400" size={24} />,
        info: <Info className="text-blue-400" size={24} />,
    };

    const buttonClasses = {
        danger: 'btn-danger',
        warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        info: 'btn-primary',
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center mb-4">
                    {icons[variant]}
                </div>
                <p className="text-dark-300">{message}</p>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
                <button onClick={onClose} className="btn-secondary" disabled={loading}>
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    className={`btn ${buttonClasses[variant]}`}
                    disabled={loading}
                >
                    {loading ? 'Processing...' : confirmText}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;