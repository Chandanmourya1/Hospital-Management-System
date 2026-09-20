import React from 'react';

/**
 * ResponsiveGrid - Standardized responsive grid components for MedCare HMS.
 * Solves viewport squeezing across mobile (1-2 cols), tablet (2-3 cols), and desktop (3-6 cols).
 */

export const StatsGrid = ({ columns = 4, className = '', children, ...props }) => {
  const colClasses = {
    2: 'grid grid-cols-1 sm:grid-cols-2',
    3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }[columns] || 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`w-full ${colClasses} gap-3 sm:gap-5 lg:gap-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardGrid = ({ columns = 3, className = '', children, ...props }) => {
  const colClasses = {
    2: 'grid grid-cols-1 md:grid-cols-2',
    3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`w-full ${colClasses} gap-4 sm:gap-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const FormGrid = ({ className = '', children, ...props }) => {
  return (
    <div className={`w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export default {
  Stats: StatsGrid,
  Cards: CardGrid,
  Form: FormGrid,
};
