import { ClockIcon } from "../components/ClockIcon"

export interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function TimeInput({ value, onChange, disabled, className }: TimeInputProps) {
  const formatOnBlur = (raw: string): string => {
    // Remove tudo que não for número
    const digits = raw.replace(/\D/g, "").padStart(6, "0").slice(-6)

    const hh = digits.slice(0, 2)
    const mm = digits.slice(2, 4)
    const ss = digits.slice(4, 6)

    return `${hh}:${mm}:${ss}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const value = e.target.value

    // Permitir apenas números e `:`
    const clean = value.replace(/[^0-9:]/g, "")

    // Bloquear múltiplos `::`
    const parts = clean.split(":")
    if (parts.length > 3) return

    onChange(clean)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const pos = (e.target as HTMLInputElement).selectionStart ?? 0

    // Impede deletar `:`
    if ((pos === 2 || pos === 5) && e.key === "Backspace") {
      e.preventDefault()
    }

    if (e.key === ":" && value.split(":").length >= 3) {
      e.preventDefault()
    }
  }

  const handleBlur = () => {
    onChange(formatOnBlur(value))
  }

  return (
    <div className="flex gap-1 items-center">
        <ClockIcon className="w-12 h-12 text-[#F2F2F2]" />
          <input
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={`w-full h-7 pl-6 pr-4 bg-[#D9D9D9] rounded-full text-[#181818] text-center text-sm font-medium focus:outline-none ${className || ''} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      placeholder="00:00:00"
      disabled={disabled}
    />
    </div>
  )
}
