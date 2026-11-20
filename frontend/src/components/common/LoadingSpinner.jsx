import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative flex items-center justify-center">
        {/* Glowing ring animation */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-2 border-amber-500/20 border-t-amber-500 border-r-amber-400`}
        />
        <div className="absolute inset-0 flex items-center justify-center text-amber-500">
          <GraduationCap className="w-4 h-4" />
        </div>
      </div>
      {text && (
        <p className="text-xs sm:text-sm font-semibold text-slate-500 tracking-wide animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
