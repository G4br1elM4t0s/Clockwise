import { Clock, Play, CheckCircle, Trash2 } from "lucide-react"
import { useTaskStore } from "../store/task.store"
import type { Task } from "../store/task.store"

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const { startTask, completeTask, deleteTask } = useTaskStore()

  const handleStart = () => {
    if (task.id) {
      startTask(task.id)
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
          <span>{task.estimatedHours}h</span>
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
        <button
          onClick={handleComplete}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded transition-colors"
        >
          Concluir
        </button>
      )}

      {task.status === "completed" && (
        <div className="text-center text-xs text-green-400">✓ Concluída</div>
      )}
    </div>
  )
}
