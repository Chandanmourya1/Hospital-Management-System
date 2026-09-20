import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * ResponsiveModal - Device-adaptive modal wrapper.
 * Guarantees that dialogs fit within mobile viewport height and scroll comfortably.
 *
 * @param {boolean} isOpen - Visibility state
 * @param {function} onClose - Close callback
 * @param {string} title - Modal heading
 * @param {string} subtitle - Optional description
 * @param {'sm'|'md'|'lg'|'xl'|'2xl'|'4xl'} size - Dialog width constraint
 * @param {React.ReactNode} icon - Header icon
 * @param {React.ReactNode} children - Modal content
 */
const ResponsiveModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'lg',
  icon,
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  }[size] || 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {/* Backdrop Click Closes */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Card */}
      <div
        className={`relative bg-white rounded-2xl sm:rounded-3xl ${sizeClasses} w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] my-auto z-10 animate-scale-up`}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-3 pr-2">
              {icon && <div className="shrink-0">{icon}</div>}
              <div>
                {title && (
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto hms-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveModal;
