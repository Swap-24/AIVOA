import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Clock, FileText, Loader2, X } from 'lucide-react';
import StatusBadge from './StatusBadge';
import {
  closeHistory,
  loadComplaintHistory,
  loadHistoricalComplaint,
} from '../store/complaintSlice';

function formatDate(value) {
  if (!value) return 'Unknown date';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function fieldOrDash(value) {
  return value || '-';
}

export default function PastComplaintsPanel() {
  const dispatch = useDispatch();
  const { history, isHistoryOpen, isLoadingHistory, historyError } = useSelector(
    (s) => s.complaint
  );

  useEffect(() => {
    if (isHistoryOpen) {
      dispatch(loadComplaintHistory());
    }
  }, [dispatch, isHistoryOpen]);

  if (!isHistoryOpen) return null;

  return (
    <div className="fixed inset-0 z-30 bg-ink/20">
      <aside className="ml-auto flex h-full w-full max-w-150 flex-col border-l border-border bg-surface shadow-xl">
        <header className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink">Past Complaints</h2>
            <p className="text-sm text-ink-soft">Saved from persistent memory</p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(closeHistory())}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
            aria-label="Close past complaints"
            title="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isLoadingHistory && (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-ink-soft">
              <Loader2 className="animate-spin" size={16} />
              Loading past complaints...
            </div>
          )}

          {!isLoadingHistory && historyError && (
            <div className="rounded-lg border border-critical/20 bg-critical-soft px-4 py-3 text-sm text-critical">
              Could not load past complaints. Check the backend connection and try again.
            </div>
          )}

          {!isLoadingHistory && !historyError && history.length === 0 && (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
              <FileText className="mb-2 text-ink-faint" size={22} />
              <p className="text-sm font-medium text-ink">No past complaints yet</p>
              <p className="text-xs text-ink-soft">Committed and draft records will appear here.</p>
            </div>
          )}

          {!isLoadingHistory && !historyError && history.length > 0 && (
            <div className="space-y-3">
              {history.map((complaint) => (
                <button
                  key={complaint.complaint_id}
                  type="button"
                  onClick={() => {
                    dispatch(loadHistoricalComplaint(complaint));
                    dispatch(closeHistory());
                  }}
                  className="block w-full rounded-lg border border-border bg-surface-sunken p-4 text-left transition-colors hover:border-accent-ring hover:bg-accent-soft"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-ink">
                        {complaint.complaint_id}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
                        <Clock size={13} />
                        {formatDate(complaint.updated_at)}
                      </p>
                    </div>
                    <StatusBadge status={complaint.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase text-ink-faint">Product</p>
                      <p className="truncate font-medium text-ink">
                        {fieldOrDash(complaint.product_name)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-faint">Batch</p>
                      <p className="truncate font-mono text-ink">
                        {fieldOrDash(complaint.batch_number)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-faint">Customer</p>
                      <p className="truncate text-ink">{fieldOrDash(complaint.customer_name)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-faint">Severity</p>
                      <p className="truncate text-ink">
                        {fieldOrDash(complaint.severity_suggested)}
                      </p>
                    </div>
                  </div>

                  {(complaint.complaint_summary || complaint.complaint_description) && (
                    <p className="mt-3 line-clamp-3 text-sm leading-5 text-ink-soft">
                      {complaint.complaint_summary || complaint.complaint_description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
