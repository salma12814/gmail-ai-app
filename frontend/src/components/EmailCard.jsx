import SentimentBadge from './SentimentBadge';
import PriorityBadge from './PriorityBadge';
import { convert } from 'html-to-text';

export default function EmailCard({ email, onClick }) {
  const analysis = email.aiAnalysis ? JSON.parse(email.aiAnalysis) : null;
  
  // Nettoie le HTML du body
  const cleanBody = email.body 
    ? convert(email.body, { wordwrap: false })
    : 'Pas de contenu';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{email.senderName || email.senderEmail}</p>
          <p className="text-sm text-gray-500">{email.subject}</p>
          <p className="text-sm text-gray-400 line-clamp-2 mt-1">{cleanBody}</p>
        </div>
        <div className="flex gap-2">
          {analysis && (
            <>
              <SentimentBadge sentiment={analysis.sentiment} />
              <PriorityBadge priority={analysis.priority} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}