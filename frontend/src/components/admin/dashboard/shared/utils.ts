export function statusColor(s: string) {
  if (s === 'Pending') return 'bg-amber-400/10 text-amber-400 border border-amber-400/20';
  if (s === 'Completed' || s === 'Approved' || s === 'Delivered') return 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20';
  if (s === 'Rejected' || s === 'Cancelled' || s === 'Refused') return 'bg-rose-400/10 text-rose-400 border border-rose-400/20';
  if (s === 'Accepted' || s === 'On the Way' || s === 'Arrived' || s === 'In Progress') return 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20';
  return 'bg-white/10 text-white border border-white/20';
}
