import { useState } from "react"
import { useTaskStore } from "../store/task.store"
import type { Task } from "../store/task.store"
import { invoke } from "@tauri-apps/api/core"
import { Clock, Check, X } from "lucide-react"

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TaskModal({ isOpen, onClose }: TaskModalProps) {
  const { addTask } = useTaskStore()
  const [taskName, setTaskName] = useState("")
  const [estimatedHours, setEstimatedHours] = useState(1.0)

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!taskName.trim()) return

    try {
      console.log("Criando task com os seguintes dados:", {
        name: taskName.trim(),
        user: "Gabriel",
        estimatedHours: estimatedHours,
        scheduledDate: new Date().toISOString().split("T")[0]
      })

      const task: Task = {
        name: taskName.trim(),
        user: "Gabriel",
        estimated_hours: estimatedHours,
        scheduled_date: new Date().toISOString().split("T")[0],
        status: "pending" as const,
        created_at: new Date().toISOString(),
        started_at: null,
        completed_at: null
      }

      console.log("Enviando task:", JSON.stringify(task, null, 2))
      await addTask(task)
      setTaskName("")
      setEstimatedHours(1.0)
      onClose()

      // Reset window size after closing modal
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
    <div className="absolute left-0 right-0 top-[55px] bottom-0 flex items-start justify-center pt-4">
      <form
        onSubmit={handleAddTask}
        className="bg-[#7F7F7F] rounded-3xl p-6 w-[400px] flex flex-col gap-4 shadow-xl"
      >
        {/* Task Name */}
        <input
          type="text"
          value={taskName}
          onChange={e => setTaskName(e.target.value)}
          className="w-full px-6 py-3 bg-[#7F7F7F] border-2 border-[#7F7F7F]/50 rounded-full text-white placeholder-white/70 focus:outline-none text-center text-lg font-medium"
          placeholder="Nome da Tarefa"
          autoFocus
          required
        />

        {/* Estimated Hours */}
        <div className="flex flex-col gap-2">
          <label className="text-white/70 uppercase text-sm px-4">Horas Estimadas</label>
          <input
            type="number"
            value={estimatedHours}
            onChange={e => setEstimatedHours(parseFloat(e.target.value))}
            step="0.5"
            min="0.5"
            className="w-full px-4 py-2 bg-[#7F7F7F]/80 border-2 border-[#7F7F7F]/50 rounded-full text-white focus:outline-none"
          />
        </div>

        {/* Date and Time */}
        <div className="flex items-center gap-2 bg-[#7F7F7F]/80 rounded-full px-4 py-2 w-fit mx-auto">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#7F7F7F]" />
          </div>
          <span className="text-white uppercase">
            {new Date()
              .toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "short"
              })
              .replace(".", "")}{" "}
            {new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit"
            })}
          </span>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-white/70 uppercase text-sm px-4">Descrição</label>
          <textarea
            className="w-full px-4 py-3 bg-[#7F7F7F]/80 border-2 border-[#7F7F7F]/50 rounded-2xl text-white placeholder-white/50 focus:outline-none min-h-[100px] resize-none"
            placeholder="Adicione uma descrição..."
          />
        </div>

        {/* Contabilizar Option */}
        <div className="flex items-center gap-2 bg-[#7F7F7F]/80 rounded-full px-4 py-2 w-fit">
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-[#7F7F7F]" />
          </div>
          <span className="text-white uppercase text-sm">Contabilizar</span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-[#7F7F7F]/80 hover:bg-[#7F7F7F] text-white rounded-full transition-colors font-medium border-2 border-[#7F7F7F]/50 min-w-[120px]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-[#17FF8B] hover:bg-[#17FF8B]/90 text-black rounded-full transition-colors font-medium min-w-[120px]"
          >
            Concluir
          </button>
        </div>
      </form>
    </div>
  )
}
