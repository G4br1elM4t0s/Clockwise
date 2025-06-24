import type { RefObject } from "react"
import { useState, useEffect } from "react"
import { useTaskStore } from "../store/task.store"
import type { Task } from "../store/task.store"
import { invoke } from "@tauri-apps/api/core"
import { Check, X } from "lucide-react"
import TimeInput from "./TimeInput"
import DateInput from "./DateInput"

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  anchorEl: RefObject<HTMLButtonElement | null>
}

export function TaskModal({ isOpen, onClose, anchorEl }: TaskModalProps) {
  const { addTask } = useTaskStore()
  const [taskName, setTaskName] = useState("")
  const [timeInput, setTimeInput] = useState("00:00:00")
  const [scheduledDate, setScheduledDate] = useState(new Date())
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [shouldCount, setShouldCount] = useState(true)

  useEffect(() => {
    if (isOpen && anchorEl.current) {
      const rect = anchorEl.current.getBoundingClientRect()
      const modalWidth = 384
      const buttonCenter = rect.left + rect.width / 2
      setPosition({
        top: rect.bottom + 8,
        left: buttonCenter - modalWidth / 2
      })
    }
  }, [isOpen, anchorEl])

  const handleTimeChange = (value: string) => {
    setTimeInput(value)
  }

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!taskName.trim()) return

    try {
      const totalHours =
        parseInt(timeInput.split(":")[0]) +
        parseInt(timeInput.split(":")[1]) / 60 +
        parseInt(timeInput.split(":")[2]) / 3600

      const task: Task = {
        name: taskName.trim(),
        user: "Gabriel",
        estimated_hours: totalHours,
        scheduled_date: scheduledDate.toISOString().split("T")[0],
        status: "pending" as const,
        created_at: new Date().toISOString(),
        started_at: null,
        completed_at: null
      }

      await addTask(task)
      setTaskName("")
      setTimeInput("00:00:00")
      setScheduledDate(new Date())
      onClose()

      setTimeout(async () => {
        await invoke("reset_window_size")
      }, 100)
    } catch (error: unknown) {
      console.error("Erro detalhado ao adicionar tarefa:", error)
      if (error instanceof Error) {
        alert(`Erro ao adicionar tarefa: ${error.message}`)
      } else {
        alert(`Erro ao adicionar tarefa: ${String(error)}`)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed z-50 bg-zinc-800/90 backdrop-blur-sm rounded-3xl shadow-lg w-96 task-modal"
      style={{
        top: position.top,
        left: position.left
      }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">Nova Tarefa</h2>
        <button
          onClick={e => {
            e.stopPropagation()
            onClose()
          }}
          className="text-zinc-400 hover:text-zinc-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form
        onSubmit={e => {
          e.stopPropagation()
          handleAddTask(e)
        }}
        className="flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Task Name */}
        <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
          <label className="text-white/70 text-sm uppercase px-6 py-1">Nome da Tarefa</label>
          <input
            type="text"
            value={taskName}
            onChange={e => setTaskName(e.target.value)}
            onClick={e => e.stopPropagation()}
            className="w-full px-6 py-3 bg-zinc-700/50 rounded-full text-white focus:outline-none text-center text-lg font-medium"
            autoFocus
            required
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
          <label className="text-white/70 text-sm uppercase px-6 py-1">Descrição</label>
          <textarea
            onClick={e => e.stopPropagation()}
            className="w-full px-6 py-4 bg-zinc-700/50 rounded-lg text-white focus:outline-none min-h-[100px] resize-none"
          />
        </div>

        {/* Date and Time Inputs */}
        <div className="flex gap-4" onClick={e => e.stopPropagation()}>
          <div className="w-3/6 flex flex-col gap-2">
            <label className="text-white/70 text-sm uppercase px-6 py-1">Data</label>
            <DateInput value={scheduledDate} onChange={setScheduledDate} />
          </div>
          <div className="w-3/6 flex flex-col gap-2">
            <label className="text-white/70 text-sm uppercase px-6 py-1">Tempo</label>
            <TimeInput value={timeInput} onChange={handleTimeChange} />
          </div>
        </div>

        {/* Checkbox for counting */}
        <label
          className="flex items-center gap-2 rounded-full px-4 py-2 cursor-pointer group"
          onClick={e => e.stopPropagation()}
        >
          <div
            className={`w-6 h-c6 rounded-full flex items-center justify-center transition-colors ${
              shouldCount ? "bg-[#17FF8B]" : "bg-white/10"
            }`}
            onClick={e => {
              e.stopPropagation()
              setShouldCount(!shouldCount)
            }}
          >
            <Check className={`w-4 h-4 ${shouldCount ? "text-zinc-800" : "text-white/30"}`} />
          </div>
          <span className="text-white uppercase group-hover:text-white/80 transition-colors">
            Contabilizar
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4 mt-2" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onClose()
            }}
            className="flex-1 h-7 cursor-pointer bg-zinc-700/50 hover:bg-zinc-700 text-white rounded-full transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 h-7 cursor-pointer bg-[#17FF8B] hover:bg-[#17FF8B]/90 text-black rounded-full transition-colors"
          >
            Concluir
          </button>
        </div>
      </form>
    </div>
  )
}
