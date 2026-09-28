export default function SentimentBadge({ sentiment }) {
  const colors = {
    positive: 'bg-green-100 text-green-800',
    negative: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-100 text-gray-800',
  };

  const icons = {
    positive: '😊',
    negative: '😞',
    neutral: '😐',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[sentiment]}`}>
      {icons[sentiment]} {sentiment}
    </span>
  );
}
