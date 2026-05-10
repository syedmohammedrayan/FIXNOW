import React from 'react';

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
  open: boolean;
}

export function SidebarLink({ icon, label, active, count, onClick, open }: SidebarLinkProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-indigo-300 hover:glass-panel border-white/10 hover:text-indigo-600'}`}
    >
      <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'} transition-colors`}>{React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}</span>
      {open && <span className="font-bold tracking-tight">{label}</span>}
      {count !== undefined && count > 0 && (
        <span className={`absolute right-4 px-2 py-0.5 rounded-lg text-[10px] font-black ${active ? 'glass-panel border-white/10 text-indigo-600' : 'bg-indigo-500 text-white'}`}>
          {count}
        </span>
      )}
    </button>
  );
}
