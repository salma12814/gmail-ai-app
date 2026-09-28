export default function PriorityBadge({ priority }) {
  const colors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
  };

  const icons = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[priority]}`}>
      {icons[priority]} {priority}
    </span>
  );
}
