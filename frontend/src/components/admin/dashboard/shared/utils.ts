export function statusColor(s: string) {
  if (s === 'Pending') return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
  if (s === 'Completed' || s === 'Approved' || s === 'Delivered') return 'bg-green-500/10 text-green-500 border border-green-500/20';
  if (s === 'Rejected') return 'bg-red-500/10 text-red-500 border border-red-500/20';
  return 'bg-sky-500/10 text-sky-500 border border-sky-500/20';
}
