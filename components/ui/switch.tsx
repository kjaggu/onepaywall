"use client"

type SwitchProps = {
  checked:    boolean
  onChange:   (next: boolean) => void
  disabled?:  boolean
  label?:     string  // accessible name
}

// iOS-style toggle. Brand-coloured track when checked. role=switch + aria-checked
// for screen readers. Keyboard space/enter activate via the underlying button.
export function Switch({ checked, onChange, disabled, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2"
      style={{
        background: checked ? "var(--color-brand)" : "#d4d4d4",
      }}
    >
      <span
        aria-hidden
        className="inline-block h-4 w-4 rounded-full bg-white transition-transform duration-150 will-change-transform"
        style={{
          transform: checked ? "translateX(18px)" : "translateX(2px)",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.15)",
        }}
      />
    </button>
  )
}
