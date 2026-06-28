import { useEffect, useRef, useState } from 'react';

/**
 * Click-to-edit text. Displays the value (or a faint placeholder); clicking
 * swaps in an <input>. Enter or click-outside (blur) commits; Escape cancels.
 */
export default function EditableField({
  value,
  placeholder = 'tap to add',
  onCommit,
  ariaLabel,
  className = '',
}: {
  value: string;
  placeholder?: string;
  onCommit: (next: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Keep the draft in sync when not actively editing.
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next !== value) onCommit(next);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        aria-label={ariaLabel}
        className={`font-hand w-full bg-transparent p-0 text-[16px] font-normal leading-snug text-ink outline-none ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      aria-label={`${ariaLabel}${value ? `: ${value}` : ', empty'}`}
      className={`block min-h-[1.4rem] w-full truncate p-0 text-left text-[16px] leading-snug ${
        value ? 'font-hand font-normal text-ink' : 'text-ink/35'
      } ${className}`}
    >
      {value || placeholder}
    </button>
  );
}
