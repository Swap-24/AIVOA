const STATUS_STYLES = {
  'Pending Triage': 'bg-warning-soft text-warning border-warning/20',
  'Ready to Commit': 'bg-success-soft text-success border-success/20',
  Committed: 'bg-accent-soft text-accent border-accent/20',
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES['Pending Triage'];
  const dotColor =
    status === 'Ready to Commit'
      ? 'bg-success'
      : status === 'Committed'
        ? 'bg-accent'
        : 'bg-warning';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${style}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
}