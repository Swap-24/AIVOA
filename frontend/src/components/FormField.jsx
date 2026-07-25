import { Sparkles } from 'lucide-react';

export default function FormField({
  label,
  value,
  onChange,
  placeholder = 'Awaiting AI extraction...',
  mono = false,
  textarea = false,
  options = null,
  highlighted = false,
  aiFilled = false,
}) {
  const baseClasses = `w-full rounded-lg border bg-surface-sunken px-3 py-2 text-sm text-ink
    placeholder:text-ink-faint transition-colors duration-150
    focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent-ring
    ${mono ? 'font-mono' : ''}
    ${highlighted ? 'field-touched' : ''}
    ${aiFilled && !highlighted ? 'border-accent-ring' : 'border-border'}`;

  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ink-soft">
        {label}
        {aiFilled && (
          <Sparkles size={11} className="text-accent" strokeWidth={2.5} />
        )}
      </label>

      {options ? (
        <select
          className={baseClasses}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea
          className={`${baseClasses} min-h-18 resize-y`}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className={baseClasses}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
