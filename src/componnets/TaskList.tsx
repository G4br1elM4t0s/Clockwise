import type { Task } from "../store/task.store"
import { Clock, Play, CheckCircle, ArrowLeft, X, Pause } from "lucide-react"

interface TaskListProps {
  tasks: Task[]
  date: Date
  onBack: () => void
  onClose: () => void
}

export function TaskList({ tasks, date, onBack, onClose }: TaskListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-[#17FF8B]" />
      case "in_progress":
        return <Play className="w-4 h-4 text-[#17FF8B]" />
      case "paused":
        return <Pause className="w-4 h-4 text-orange-400" />
      case "waiting":
        return <Clock className="w-4 h-4 text-yellow-400" />
      default:
        return <Clock className="w-4 h-4 text-[#17FF8B]" />
    }
  }

  return (
    <div className="custom-calendar" style={{ height: "336px", width: "280px" }}>
      {/* Header com navegação */}
      <div className="flex items-center justify-between h-7">
        <button
          onClick={e => {
            e.stopPropagation()
            onBack()
          }}
          className="text-[#17FF8B] hover:bg-[#17FF8B]/20 p-1 rounded-full transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-white font-medium text-sm">
          {date.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long"
          })}
        </div>
        <button
          onClick={e => {
            e.stopPropagation()
            onClose()
          }}
          className="text-[#17FF8B] hover:bg-[#17FF8B]/20 p-1 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de tarefas */}
      <div className="space-y-2 mt-4 h-[calc(100%-44px)] overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-gray-400 text-sm text-center">Nenhuma tarefa para este dia</div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className="flex items-center justify-between bg-black/20 p-3 rounded-lg hover:bg-black/30 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getStatusIcon(task.status)}
                <span className="text-white text-sm truncate">{task.name}</span>
              </div>
              <div className="text-[#17FF8B] text-xs ml-2 whitespace-nowrap">
                {task.estimated_hours}h
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
