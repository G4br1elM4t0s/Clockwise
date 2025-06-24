import { useState } from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Calendar from "./Calendar"

interface DateInputProps {
  value: Date
  onChange: (date: Date) => void
}

export default function DateInput({ value, onChange }: DateInputProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const formattedDate = format(value, "dd/MM/yyyy", {
    locale: ptBR
  })

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date)
      setIsCalendarOpen(false)
    }
  }

  return (
    <div className="relative w-full">
      {isCalendarOpen && (
        <div className="absolute right-full top-[-210px] mr-2 z-50">
          <Calendar selected={value} onSelect={handleSelect} />
        </div>
      )}

      <button
        type="button"
        className="w-full h-7 bg-zinc-700/50 rounded-full flex items-center justify-center cursor-pointer hover:bg-zinc-700/70 transition-colors"
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[#17FF8B]" />
          <span className="text-white text-sm">{formattedDate}</span>
        </div>
      </button>
    </div>
  )
}
