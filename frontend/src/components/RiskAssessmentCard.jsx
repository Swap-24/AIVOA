import { CopyCheck, ShieldAlert } from 'lucide-react';
import FormField from './FormField';

const SEVERITY_DOT = {
  Critical: 'bg-critical',
  Major: 'bg-warning',
  Minor: 'bg-minor',
};

export default function RiskAssessmentCard({ form, updatedFields, onChange }) {
  const duplicateIds = form.duplicate_complaint_ids
    ? form.duplicate_complaint_ids.split(',').map((id) => id.trim()).filter(Boolean)
    : [];

  return (
    <div className="rounded-xl border border-accent-ring bg-accent-soft p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert size={15} className="text-accent" />
        <span className="text-xs font-semibold uppercase tracking-wide text-accent">
          AI Copilot Complaint Insights
        </span>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-3">
        <FormField
          label="Complaint Summary"
          value={form.complaint_summary}
          onChange={(v) => onChange('complaint_summary', v)}
          highlighted={updatedFields.includes('complaint_summary')}
          aiFilled={!!form.complaint_summary}
        />

        <div className="rounded-lg border border-accent-ring bg-surface px-3 py-2">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
            <CopyCheck size={12} className="text-accent" />
            Duplicate Complaint Detection
          </label>
          {duplicateIds.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {duplicateIds.map((id) => (
                <span
                  key={id}
                  className="rounded-md border border-warning/20 bg-warning-soft px-2 py-1 font-mono text-xs font-medium text-warning"
                >
                  {id}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-soft">No duplicate matches found.</p>
          )}
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
            <span
              className={`h-1.5 w-1.5 rounded-full ${SEVERITY_DOT[form.severity_suggested] ?? 'bg-ink-faint'}`}
            />
            Severity (Suggested)
          </label>
          <input
            className="w-full rounded-lg border border-accent-ring bg-surface px-3 py-2 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-accent-ring"
            value={form.severity_suggested ?? ''}
            placeholder="-"
            onChange={(e) => onChange('severity_suggested', e.target.value)}
          />
        </div>
        <FormField
          label="Suggested Next Action"
          value={form.suggested_next_action}
          onChange={(v) => onChange('suggested_next_action', v)}
          highlighted={updatedFields.includes('suggested_next_action')}
          aiFilled={!!form.suggested_next_action}
        />
      </div>

      <FormField
        label="Initial Risk Assessment"
        value={form.initial_risk_assessment}
        onChange={(v) => onChange('initial_risk_assessment', v)}
        textarea
        highlighted={updatedFields.includes('initial_risk_assessment')}
        aiFilled={!!form.initial_risk_assessment}
      />

      <div className="mt-3 grid grid-cols-1 gap-3">
        <FormField
          label="Root Cause Recommendation"
          value={form.root_cause_recommendation}
          onChange={(v) => onChange('root_cause_recommendation', v)}
          textarea
          highlighted={updatedFields.includes('root_cause_recommendation')}
          aiFilled={!!form.root_cause_recommendation}
        />
        <FormField
          label="CAPA Recommendation"
          value={form.capa_recommendation}
          onChange={(v) => onChange('capa_recommendation', v)}
          textarea
          highlighted={updatedFields.includes('capa_recommendation')}
          aiFilled={!!form.capa_recommendation}
        />
      </div>
    </div>
  );
}
