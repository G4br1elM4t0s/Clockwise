import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Calendar from "./Calendar"

import { CalendarIcon } from "../components/CalendarIcon"
import { CalendarStartIcon } from "../components/CalendarStartIcon"

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
    <div className="relative flex items-center gap-1">
      {isCalendarOpen && (
        <div className="absolute right-full top-[-210px] mr-2 z-50">
          <Calendar selected={value} onSelect={handleSelect} />
        </div>
      )}

      <button type="button" className="cursor-pointer" onClick={() => setIsCalendarOpen(!isCalendarOpen)}>
        <div className="relative w-10 h-10">
          <div className={`absolute inset-0 transition-all duration-500 ${isCalendarOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <CalendarStartIcon className="w-10 h-10 text-[#17FF8B]" />
          </div>
          <div className={`absolute inset-0 transition-all duration-500 ${!isCalendarOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <CalendarIcon className="w-10 h-10 text-white" />
          </div>
        </div>
      </button>

      <button
        type="button"
        className="h-7 px-4 w-full bg-[#D9D9D9] rounded-full flex items-center justify-center cursor-pointer hover:bg-zinc-700/70 transition-colors"
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
      >
        <div className="flex items-center">
          <span className="text-[#181818] text-sm font-semibold">{formattedDate}</span>
        </div>
      </button>
    </div>
  )
}
