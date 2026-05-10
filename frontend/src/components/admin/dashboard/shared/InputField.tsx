import React from 'react';

interface InputFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}

export function InputField({ label, type = "text", placeholder = "", value, onChange }: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
      <input
        type={type} 
        placeholder={placeholder} 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="w-full glass-panel border-white/10 border border-slate-100 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 transition outline-none placeholder:text-slate-300 caret-indigo-500"
      />
    </div>
  );
}
