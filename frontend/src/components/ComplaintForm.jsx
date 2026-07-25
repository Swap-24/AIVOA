import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, History } from 'lucide-react';
import FormField from './FormField';
import RiskAssessmentCard from './RiskAssessmentCard';
import StatusBadge from './StatusBadge';
import { updateField, commit, resetSession, toggleHistory } from '../store/complaintSlice';

const SOURCE_OPTIONS = [
  'Email',
  'Pharmacy',
  'Physician',
  'Distributor',
  'Patient',
  'Regulatory Authority',
  'Other',
];

const SECTIONS = [
  {
    title: '1. Origin & Customer Details',
    fields: [
      { key: 'complaint_source', label: 'Complaint Source', options: SOURCE_OPTIONS },
      { key: 'customer_name', label: 'Customer Name' },
    ],
  },
  {
    title: '2. Product & Batch Identification',
    fields: [
      { key: 'product_name', label: 'Product Name (API/FDF)' },
      { key: 'product_strength', label: 'Product Strength / Grade' },
      { key: 'batch_number', label: 'Batch / Lot Number', mono: true },
      { key: 'affected_quantity', label: 'Affected Quantity' },
      { key: 'manufacturing_date', label: 'Manufacturing Date' },
      { key: 'expiry_date', label: 'Expiry Date' },
    ],
  },
  {
    title: '3. Facility & Material Impact',
    fields: [
      { key: 'originating_site_block', label: 'Originating Site Block' },
      { key: 'impacted_npm', label: 'Impacted Non-Product Materials (NPM)' },
    ],
  },
  {
    title: '4. Defect Analysis',
    fields: [
      { key: 'complaint_category', label: 'Complaint Category' },
      {
        key: 'complaint_description',
        label: 'Structured Defect Summary',
        textarea: true,
      },
    ],
  },
];

const REQUIRED_FIELD_LABELS = {
  complaint_source: 'Complaint Source',
  customer_name: 'Customer Name',
  product_name: 'Product Name',
  batch_number: 'Batch / Lot Number',
  affected_quantity: 'Affected Quantity',
  complaint_description: 'Structured Defect Summary',
};

export default function ComplaintForm() {
  const dispatch = useDispatch();
  const { form, updatedFields, completeness, missingRequiredFields, isCommitting } = useSelector(
    (s) => s.complaint
  );


  const [flashing, setFlashing] = useState([]);
  useEffect(() => {
    if (updatedFields.length === 0) return;
    setFlashing(updatedFields);
    const timer = setTimeout(() => setFlashing([]), 1600);
    return () => clearTimeout(timer);
  }, [JSON.stringify(updatedFields)]);

  const hasInsights = !!(
    form.severity_suggested ||
    form.complaint_summary ||
    form.root_cause_recommendation ||
    form.capa_recommendation ||
    form.duplicate_complaint_ids
  );
  const readyToCommit = form.status === 'Ready to Commit';
  const isCommitted = form.status === 'Committed';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex-none border-b border-border px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink">Log Customer Complaint</h1>
            <p className="text-sm text-ink-soft">API &amp; FDF Quality Assurance Module</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch(toggleHistory())}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
              aria-label="Show past complaints"
              title="Past complaints"
            >
              <History size={17} />
            </button>
            <StatusBadge status={form.status} />
          </div>
        </div>

        {completeness > 0 && completeness < 1 && (
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${completeness * 100}%` }}
            />
          </div>
        )}
      </header>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {completeness > 0 && (
          <div className="rounded-lg border border-border bg-surface-sunken px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Complaint Completeness Checker
                </h2>
                <p className="mt-1 text-sm font-medium text-ink">
                  {Math.round(completeness * 100)}% complete
                </p>
              </div>
              {missingRequiredFields.length === 0 ? (
                <span className="rounded-md bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
                  Ready
                </span>
              ) : (
                <span className="rounded-md bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning">
                  Missing {missingRequiredFields.length}
                </span>
              )}
            </div>
            {missingRequiredFields.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {missingRequiredFields.map((field) => (
                  <span
                    key={field}
                    className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink-soft"
                  >
                    {REQUIRED_FIELD_LABELS[field] ?? field}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {section.title}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <div
                  key={field.key}
                  className={field.textarea ? 'col-span-2' : undefined}
                >
                  <FormField
                    label={field.label}
                    value={form[field.key]}
                    onChange={(v) => dispatch(updateField({ field: field.key, value: v }))}
                    mono={field.mono}
                    textarea={field.textarea}
                    options={field.options}
                    highlighted={flashing.includes(field.key)}
                    aiFilled={!!form[field.key]}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {hasInsights && (
          <RiskAssessmentCard
            form={form}
            updatedFields={flashing}
            onChange={(field, value) => dispatch(updateField({ field, value }))}
          />
        )}
      </div>

      <footer className="flex-none border-t border-border px-6 py-4">
        {isCommitted ? (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-success-soft py-2.5 text-sm font-medium text-success">
            <CheckCircle2 size={16} />
            Committed to QMS Ledger - {form.complaint_id}
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => dispatch(resetSession())}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-sunken"
            >
              Reset Form
            </button>
            <button
              onClick={() => dispatch(commit())}
              disabled={!readyToCommit || isCommitting}
              className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-border-strong disabled:text-ink-faint"
            >
              {isCommitting ? 'Committing...' : 'Commit to QMS Ledger'}
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}
