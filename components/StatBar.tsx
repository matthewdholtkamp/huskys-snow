
import React from 'react';
import type { IconType } from '../types';

interface StatBarProps {
  label: string;
  value: number;
  icon: IconType;
  color: string;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, icon: Icon, color }) => (
  <div className="flex items-center gap-2 mb-1">
    <Icon size={14} className="text-slate-400" />
    <div className="text-xs font-bold text-slate-300 w-16">{label}</div>
    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
      <div 
        className={`h-full ${color} transition-all duration-500`} 
        style={{ width: `${(value / 20) * 100}%` }}
      ></div>
    </div>
    <span className="text-xs text-slate-400 w-4 text-right">{value}</span>
  </div>
);

export default StatBar;
