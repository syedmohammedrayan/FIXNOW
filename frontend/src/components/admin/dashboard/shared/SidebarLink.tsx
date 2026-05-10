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
      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative ${active ? 'bg-white text-slate-900 shadow-xl shadow-black/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
    >
      <span className={`${active ? 'text-slate-900' : 'text-slate-400 group-hover:text-white'} transition-colors`}>{React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}</span>
      {open && <span className="font-bold tracking-tight">{label}</span>}
      {count !== undefined && count > 0 && (
        <span className={`absolute right-4 px-2 py-0.5 rounded-lg text-[10px] font-black ${active ? 'bg-slate-900/10 text-slate-900' : 'bg-white/10 text-white border border-white/10'}`}>
          {count}
        </span>
      )}
    </button>
  );
}
