interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function CustomCheckbox({ checked, onChange, label, className = '' }: CustomCheckboxProps) {
  return (
    <label className={`flex items-center gap-1 cursor-pointer group ${className}`}>
      <div className="relative">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            checked ? 'bg-[#17FF8B]' : 'bg-white/10'
          }`}
          onClick={() => onChange(!checked)}
        >
          {checked && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9.55 18L3.85 12.3L5.275 10.875L9.55 15.15L18.725 5.975L20.15 7.4L9.55 18Z"
                fill="#1A1A1A"
              />
            </svg>
          )}
        </div>
      </div>
      {label && (
        <span className="text-[#F2F2F2] text-xs font-medium tracking-wide group-hover:text-white/80 transition-colors">
          {label}
        </span>
      )}
    </label>
  );
}
