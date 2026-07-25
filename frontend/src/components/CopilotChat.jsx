import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Paperclip, Send, Sparkles } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { sendMessage, uploadPdf } from '../store/complaintSlice';

export default function CopilotChat() {
  const dispatch = useDispatch();
  const { messages, isProcessing } = useSelector((s) => s.complaint);
  const [draft, setDraft] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || isProcessing) return;
    dispatch(sendMessage(trimmed));
    setDraft('');
  };

  const handleFile = (file) => {
    if (!file || isProcessing) return;
    if (file.type !== 'application/pdf') return;
    dispatch(uploadPdf(file));
  };

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
    >
      <header className="flex flex-none items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
            <Sparkles size={14} className="text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">AIVOA Copilot</h2>
            <p className="text-xs text-ink-faint">Drop complaint files or paste text below</p>
          </div>
        </div>
        <span
          className={`h-2 w-2 rounded-full ${isProcessing ? 'animate-pulse bg-warning' : 'bg-success'}`}
        />
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 pl-8 text-xs text-ink-faint">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-faint" />
            </span>
            analyzing
          </div>
        )}
      </div>

      <div className="flex-none border-t border-border bg-surface p-4">
        <div
          className={`flex items-end gap-2 rounded-xl border bg-surface px-3 py-2 transition-colors ${
            isDragging ? 'border-accent bg-accent-soft' : 'border-border'
          }`}
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-surface-sunken hover:text-accent disabled:opacity-40"
            title="Attach PDF"
          >
            <Paperclip size={17} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <textarea
            value={draft}
            disabled={isProcessing}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isDragging ? 'Drop PDF to upload...' : 'Type a message or paste a complaint...'}
            rows={2}
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-1 text-sm text-ink outline-none placeholder:text-ink-faint disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || isProcessing}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-border-strong"
            title="Send message"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-faint">
          Powered by LangGraph - AI responses may contain errors
        </p>
      </div>
    </div>
  );
}
