import React from 'react';
import { motion } from 'framer-motion';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  className = '',
}) => {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-xl hover:border-amber-400/40 transition-all flex flex-col justify-between space-y-3 relative overflow-hidden group ${className}`}
    >
      {/* Ambient background hover glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />

      <div className="flex items-center justify-between gap-3 relative z-10">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 truncate">
          {title}
        </span>
        {Icon && (
          <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-amber-50 group-hover:text-amber-800 group-hover:border-amber-200/60 transition-colors shadow-2xs">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="space-y-1 relative z-10">
        <div className="text-2xl sm:text-3xl font-heading font-black text-slate-900 tracking-tight truncate">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
            {trend && (
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                {trend}
              </span>
            )}
            {subtitle && <span className="truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
