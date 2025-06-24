interface TimeInputProps {
  value: string
  onChange: (value: string) => void
}

export default function TimeInput({ value, onChange }: TimeInputProps) {
  const formatOnBlur = (raw: string): string => {
    // Remove tudo que não for número
    const digits = raw.replace(/\D/g, "").padStart(6, "0").slice(-6)

    const hh = digits.slice(0, 2)
    const mm = digits.slice(2, 4)
    const ss = digits.slice(4, 6)

    return `${hh}:${mm}:${ss}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <input
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="w-full h-7 pl-6 pr-4 bg-zinc-700/50 rounded-full text-white text-center text-sm font-mono focus:outline-none"
      placeholder="00:00:00"
    />
  )
}
