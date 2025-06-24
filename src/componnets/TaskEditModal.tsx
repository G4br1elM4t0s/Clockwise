import type { RefObject } from "react"
import { useState, useEffect } from "react"
import { useTaskStore } from "../store/task.store"
import type { Task } from "../store/task.store"
import { invoke } from "@tauri-apps/api/core"
import { X, Trash2, Play, Pause, Square } from "lucide-react"
import TimeInput from "./TimeInput"
import DateInput from "./DateInput"

interface TaskEditModalProps {
  isOpen: boolean
  onClose: () => void
  anchorEl: RefObject<HTMLButtonElement | null>
  task: Task
}

export function TaskEditModal({ isOpen, onClose, anchorEl, task }: TaskEditModalProps) {
  const { deleteTask, completeTask, pauseTask } = useTaskStore()
  const [taskName, setTaskName] = useState(task.name)
  const [timeInput, setTimeInput] = useState(() => {
    const hours = Math.floor(task.estimated_hours || 0)
    const minutes = Math.floor(((task.estimated_hours || 0) - hours) * 60)
    const seconds = Math.floor((((task.estimated_hours || 0) - hours) * 60 - minutes) * 60)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`
  })
  const [scheduledDate, setScheduledDate] = useState(new Date(task.scheduled_date || new Date()))
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && anchorEl.current) {
      const rect = anchorEl.current.getBoundingClientRect()
      const modalWidth = 384
      const modalHeight = 500 // Altura aproximada do modal
      const buttonCenter = rect.left + rect.width / 2

      // Calcular posição horizontal com limites da viewport
      let leftPosition = buttonCenter - modalWidth / 2
      const rightEdge = leftPosition + modalWidth
      const leftEdge = leftPosition

      // Ajustar se ultrapassar a borda direita
      if (rightEdge > window.innerWidth - 20) {
        leftPosition = window.innerWidth - modalWidth - 20
      }

      // Ajustar se ultrapassar a borda esquerda
      if (leftEdge < 20) {
        leftPosition = 20
      }

      // Calcular posição vertical
      let topPosition = rect.bottom + 8

      // Se o modal ultrapassar a borda inferior, posicionar acima do botão
      if (topPosition + modalHeight > window.innerHeight - 20) {
        topPosition = rect.top - modalHeight - 8
      }

      // Se ainda assim ultrapassar a borda superior, centralizar na tela
      if (topPosition < 20) {
        topPosition = (window.innerHeight - modalHeight) / 2
      }

      setPosition({
        top: topPosition,
        left: leftPosition
      })
    }
  }, [isOpen, anchorEl])

  // Resetar valores do modal quando task mudar
  useEffect(() => {
    setTaskName(task.name)
    const hours = Math.floor(task.estimated_hours || 0)
    const minutes = Math.floor(((task.estimated_hours || 0) - hours) * 60)
    const seconds = Math.floor((((task.estimated_hours || 0) - hours) * 60 - minutes) * 60)
    setTimeInput(
      `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`
    )
    setScheduledDate(new Date(task.scheduled_date || new Date()))
  }, [task])

  const handleTimeChange = (value: string) => {
    setTimeInput(value)
  }

  const handleUpdateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!taskName.trim() || isLoading) return

    setIsLoading(true)
    try {
      const totalHours =
        parseInt(timeInput.split(":")[0]) +
        parseInt(timeInput.split(":")[1]) / 60 +
        parseInt(timeInput.split(":")[2]) / 3600

      const updatedTask: Task = {
        ...task,
        name: taskName.trim(),
        estimated_hours: totalHours,
        scheduled_date: scheduledDate.toISOString().split("T")[0]
      }

      // Por enquanto, apenas fechamos o modal
      // A funcionalidade de updateTask pode ser implementada futuramente
      console.log("Task atualizada:", updatedTask)
      onClose()

      setTimeout(async () => {
        await invoke("reset_window_size")
      }, 100)
    } catch (error: unknown) {
      console.error("Erro ao atualizar tarefa:", error)
      if (error instanceof Error) {
        alert(`Erro ao atualizar tarefa: ${error.message}`)
      } else {
        alert(`Erro ao atualizar tarefa: ${String(error)}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteTask = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      if (task.id) {
        await completeTask(task.id)
      }
      onClose()
    } catch (error) {
      console.error("Erro ao concluir tarefa:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTask = async () => {
    if (isLoading) return
    const confirmed = confirm("Tem certeza que deseja excluir esta tarefa?")
    if (!confirmed) return

    setIsLoading(true)
    try {
      if (task.id) {
        await deleteTask(task.id)
      }
      onClose()
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleTask = async () => {
    if (isLoading || !task.id) return
    setIsLoading(true)
    try {
      if (task.status === "in_progress" || task.status === "waiting") {
        await pauseTask(task.id)
      } else if (task.status === "pending" || task.status === "paused") {
        await invoke("start_task", {
          taskId: task.id,
          stopAndStart: true
        })
      }
      onClose()
    } catch (error) {
      console.error("Erro ao alterar status da tarefa:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTaskStatusColor = () => {
    switch (task.status) {
      case "in_progress":
      case "waiting":
        return "text-[#17FF8B]"
      case "paused":
        return "text-[#FF396D]"
      case "completed":
        return "text-blue-400"
      default:
        return "text-gray-400"
    }
  }

  const getTaskStatusText = () => {
    switch (task.status) {
      case "in_progress":
        return "Em Andamento"
      case "waiting":
        return "Aguardando"
      case "paused":
        return "Pausada"
      case "completed":
        return "Concluída"
      default:
        return "Pendente"
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed z-50 bg-zinc-800/90 backdrop-blur-sm rounded-3xl shadow-lg w-96 task-modal"
      style={{
        top: position.top + 50,
        left: position.left
      }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-zinc-100">Editar Tarefa</h2>
          <span className={`text-sm ${getTaskStatusColor()}`}>Status: {getTaskStatusText()}</span>
        </div>
        <button
          onClick={e => {
            e.stopPropagation()
            onClose()
          }}
          className="text-zinc-400 hover:text-zinc-100"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form
        onSubmit={e => {
          e.stopPropagation()
          handleUpdateTask(e)
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
            required
            disabled={isLoading}
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

        {/* Quick Action Buttons */}
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          {task.status !== "completed" && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                handleToggleTask()
              }}
              disabled={isLoading}
              className="flex-1 h-8 flex items-center justify-center gap-2 cursor-pointer bg-blue-600/80 hover:bg-blue-600 text-white rounded-full transition-colors disabled:opacity-50"
            >
              {task.status === "in_progress" || task.status === "waiting" ? (
                <>
                  <Pause className="w-3 h-3" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Iniciar
                </>
              )}
            </button>
          )}

          {task.status !== "completed" && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                handleCompleteTask()
              }}
              disabled={isLoading}
              className="flex-1 h-8 flex items-center justify-center gap-2 cursor-pointer bg-[#17FF8B]/80 hover:bg-[#17FF8B] text-black rounded-full transition-colors disabled:opacity-50"
            >
              <Square className="w-3 h-3" />
              Concluir
            </button>
          )}

          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              handleDeleteTask()
            }}
            disabled={isLoading}
            className="h-8 w-8 flex items-center justify-center cursor-pointer bg-red-600/80 hover:bg-red-600 text-white rounded-full transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-4 mt-2" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onClose()
            }}
            disabled={isLoading}
            className="flex-1 h-7 cursor-pointer bg-zinc-700/50 hover:bg-zinc-700 text-white rounded-full transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-7 cursor-pointer bg-[#17FF8B] hover:bg-[#17FF8B]/90 text-black rounded-full transition-colors disabled:opacity-50"
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  )
}
