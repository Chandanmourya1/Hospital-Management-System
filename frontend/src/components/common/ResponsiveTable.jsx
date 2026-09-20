import React from 'react';

/**
 * ResponsiveTable - Container wrapper that guarantees touch-friendly horizontal scrolling
 * for tabular data on mobile and tablet devices, preventing parent container blowout.
 *
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - HTML <table> or table elements
 * @param {boolean} showScrollHint - Whether to display a subtle scroll swipe indicator on small screens
 */
const ResponsiveTable = ({
  className = '',
  children,
  showScrollHint = false,
  ...props
}) => {
  return (
    <div className={`w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-xs ${className}`} {...props}>
      {showScrollHint && (
        <div className="sm:hidden px-4 py-1.5 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500 font-medium flex items-center justify-between">
          <span>&larr; Swipe to view full table &rarr;</span>
          <span className="font-bold text-sky-600">Scrollable</span>
        </div>
      )}
      <div className="w-full overflow-x-auto hms-scrollbar -webkit-overflow-scrolling-touch">
        {children}
      </div>
    </div>
  );
};

export default ResponsiveTable;
