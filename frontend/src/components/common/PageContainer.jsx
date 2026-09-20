import React from 'react';

/**
 * PageContainer - Standard responsive container for all MedCare HMS pages.
 * Ensures uniform margins, padding, and responsive max-widths across all screen sizes.
 *
 * @param {'default'|'narrow'|'wide'|'full'} size - Max width constraint (default: max-w-7xl, narrow: max-w-5xl, wide: max-w-screen-2xl, full: max-w-full)
 * @param {string} className - Additional CSS classes to merge
 * @param {React.ReactNode} header - Optional header node (e.g. page title, action buttons)
 * @param {React.ReactNode} children - Main page content
 */
const PageContainer = ({
  size = 'default',
  className = '',
  header,
  children,
  ...props
}) => {
  const sizeClasses = {
    narrow: 'max-w-5xl',
    default: 'max-w-[1600px]',
    wide: 'max-w-[1750px]',
    full: 'max-w-full',
  }[size] || 'max-w-[1600px]';

  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-5 sm:py-7 lg:py-8 space-y-5 sm:space-y-6 lg:space-y-8 print:p-0 print:m-0 print:w-full print:max-w-none print:space-y-0 ${sizeClasses} ${className}`}
      {...props}
    >
      {header && (
        <div className="w-full">
          {header}
        </div>
      )}
      {children}
    </div>
  );
};

export default PageContainer;
