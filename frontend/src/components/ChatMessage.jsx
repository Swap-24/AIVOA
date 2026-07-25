import { FileText, Sparkles, User, AlertCircle } from 'lucide-react';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex h-6 w-6 flex-none items-center justify-center rounded-full ${
          isUser ? 'bg-border' : 'bg-accent-soft'
        }`}
      >
        {isUser ? (
          <User size={12} className="text-ink-soft" />
        ) : (
          <Sparkles size={12} className="text-accent" />
        )}
      </div>

      <div
        className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-accent text-white'
            : message.isError
              ? 'bg-critical-soft text-critical'
              : 'bg-surface-sunken text-ink'
        }`}
      >
        {message.isFile ? (
          <div className="flex items-center gap-2">
            <FileText size={16} className={isUser ? 'text-white' : 'text-ink-soft'} />
            <div>
              <div className="font-medium">{message.content}</div>
              <div className={`text-xs ${isUser ? 'text-white/70' : 'text-ink-faint'}`}>
                PDF Document
              </div>
            </div>
          </div>
        ) : message.isError ? (
          <div className="flex items-start gap-1.5">
            <AlertCircle size={14} className="mt-0.5 flex-none" />
            <span>{message.content}</span>
          </div>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
}