import { Clock, Play, CheckCircle, Trash2, Pause } from "lucide-react"
import { useTaskStore } from "../store/task.store"
import type { Task } from "../store/task.store"

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const { startTask, pauseTask, resumeTask, completeTask, deleteTask } = useTaskStore()

  const handleStart = () => {
    if (task.id) {
      startTask(task.id)
    }
  }

  const handlePause = () => {
    if (task.id) {
      pauseTask(task.id)
    }
  }

  const handleResume = () => {
    if (task.id) {
      resumeTask(task.id)
    }
  }

  const handleComplete = () => {
    if (task.id) {
      completeTask(task.id)
    }
  }

  const handleDelete = () => {
    if (task.id) {
      deleteTask(task.id)
    }
  }

  const getStatusColor = () => {
    switch (task.status) {
      case "completed":
        return "bg-green-600/20 border-green-500/30"
      case "in_progress":
        return "bg-blue-600/20 border-blue-500/30"
      case "paused":
        return "bg-orange-600/20 border-orange-500/30"
      case "waiting":
        return "bg-yellow-600/20 border-yellow-500/30"
      default:
        return "bg-gray-600/20 border-gray-500/30"
    }
  }

  const getStatusIcon = () => {
    switch (task.status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "in_progress":
        return <Play className="w-4 h-4 text-blue-400" />
      case "paused":
        return <Pause className="w-4 h-4 text-orange-400" />
      case "waiting":
        return <Clock className="w-4 h-4 text-yellow-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div
      className={`min-w-[200px] p-3 rounded-lg border ${getStatusColor()} hover:bg-opacity-80 transition-all duration-200 group`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="text-white text-sm font-medium truncate">{task.name}</h3>
        </div>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-300 mb-2">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{task.estimated_hours}h</span>
        </div>
      </div>

      {task.status === "pending" && (
        <button
          onClick={handleStart}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded transition-colors"
        >
          Iniciar
        </button>
      )}

      {task.status === "in_progress" && (
        <div className="flex gap-1">
          <button
            onClick={handlePause}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs py-1 px-2 rounded transition-colors"
          >
            Pausar
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded transition-colors"
          >
            Concluir
          </button>
        </div>
      )}

      {task.status === "paused" && (
        <div className="flex gap-1">
          <button
            onClick={handleResume}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded transition-colors"
          >
            Retomar
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded transition-colors"
          >
            Concluir
          </button>
        </div>
      )}

      {task.status === "waiting" && (
        <div className="flex gap-1">
          <button
            onClick={handlePause}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs py-1 px-2 rounded transition-colors"
          >
            Pausar
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded transition-colors"
          >
            Concluir
          </button>
        </div>
      )}

      {task.status === "completed" && (
        <div className="text-center text-xs text-green-400">✓ Concluída</div>
      )}
    </div>
  )
}
