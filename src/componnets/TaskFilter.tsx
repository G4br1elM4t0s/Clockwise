import { useState } from "react"
import { useTaskStore, type Task } from "../store/task.store"
import { Filter, X, CheckCircle, Clock, Play, Pause, Square } from "lucide-react"

interface TaskFilterProps {
  onFilterChange: (filteredTasks: Task[]) => void
  isOpen: boolean
  onClose: () => void
  embedded?: boolean // Para usar dentro de outro componente
}

export function TaskFilter({ onFilterChange, isOpen, onClose, embedded = false }: TaskFilterProps) {
  const { tasks, getAllTasksByStatus } = useTaskStore()
  const [selectedFilters, setSelectedFilters] = useState<Set<Task["status"]>>(new Set())

  const statusConfig = {
    pending: {
      label: "Pendentes",
      icon: Clock,
      color: "text-gray-400",
      bgColor: "bg-gray-600/20 border-gray-500/30"
    },
    in_progress: {
      label: "Em Andamento",
      icon: Play,
      color: "text-[#17FF8B]",
      bgColor: "bg-green-600/20 border-green-500/30"
    },
    paused: {
      label: "Pausadas",
      icon: Pause,
      color: "text-orange-400",
      bgColor: "bg-orange-600/20 border-orange-500/30"
    },
    waiting: {
      label: "Aguardando",
      icon: Square,
      color: "text-yellow-400",
      bgColor: "bg-yellow-600/20 border-yellow-500/30"
    },
    completed: {
      label: "Concluídas",
      icon: CheckCircle,
      color: "text-blue-400",
      bgColor: "bg-blue-600/20 border-blue-500/30"
    }
  }

  const tasksByStatus = getAllTasksByStatus()

  const handleFilterToggle = (status: Task["status"]) => {
    const newFilters = new Set(selectedFilters)

    if (newFilters.has(status)) {
      newFilters.delete(status)
    } else {
      newFilters.add(status)
    }

    setSelectedFilters(newFilters)

    // Aplicar filtros
    if (newFilters.size === 0) {
      // Se nenhum filtro selecionado, mostrar todas as tarefas
      onFilterChange(tasks)
    } else {
      // Filtrar tarefas pelos status selecionados
      const filteredTasks = tasks.filter(task => newFilters.has(task.status))
      onFilterChange(filteredTasks)
    }
  }

  const clearAllFilters = () => {
    setSelectedFilters(new Set())
    onFilterChange(tasks)
  }

  const selectAllFilters = () => {
    const allStatuses = new Set(Object.keys(statusConfig) as Task["status"][])
    setSelectedFilters(allStatuses)
    onFilterChange(tasks)
  }

  if (!isOpen) return null

  const containerClass = embedded
    ? "w-full bg-transparent"
    : "fixed z-50 bg-zinc-800/90 backdrop-blur-sm rounded-3xl shadow-lg w-80 p-6"

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#17FF8B]" />
          <h2 className="text-lg font-semibold text-zinc-100">Filtrar Tarefas</h2>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Botões de ação rápida */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={clearAllFilters}
          className="flex-1 text-xs py-2 px-3 bg-zinc-700/50 hover:bg-zinc-700 text-white rounded-full transition-colors"
        >
          Limpar
        </button>
        <button
          onClick={selectAllFilters}
          className="flex-1 text-xs py-2 px-3 bg-[#17FF8B]/20 hover:bg-[#17FF8B]/30 text-[#17FF8B] rounded-full transition-colors"
        >
          Todos
        </button>
      </div>

      {/* Lista de filtros por status */}
      <div className="space-y-2">
        {Object.entries(statusConfig).map(([status, config]) => {
          const taskStatus = status as Task["status"]
          const count = tasksByStatus[taskStatus]?.length || 0
          const isSelected = selectedFilters.has(taskStatus)
          const IconComponent = config.icon

          return (
            <button
              key={status}
              onClick={() => handleFilterToggle(taskStatus)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                isSelected
                  ? config.bgColor + " ring-1 ring-current"
                  : "bg-zinc-700/30 border-zinc-600/50 hover:bg-zinc-700/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <IconComponent
                  className={`w-4 h-4 ${isSelected ? config.color : "text-gray-400"}`}
                />
                <span className={`font-medium ${isSelected ? "text-white" : "text-gray-300"}`}>
                  {config.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isSelected ? config.color : "text-gray-400"}`}>
                  {count}
                </span>
                {isSelected && <div className="w-2 h-2 rounded-full bg-current"></div>}
              </div>
            </button>
          )
        })}
      </div>

      {/* Resumo dos filtros ativos */}
      {selectedFilters.size > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-600">
          <div className="text-sm text-gray-400 mb-2">
            {selectedFilters.size} filtro{selectedFilters.size > 1 ? "s" : ""} ativo
            {selectedFilters.size > 1 ? "s" : ""}
          </div>
          <div className="flex flex-wrap gap-1">
            {Array.from(selectedFilters).map(status => (
              <span
                key={status}
                className="text-xs px-2 py-1 bg-[#17FF8B]/20 text-[#17FF8B] rounded-full"
              >
                {statusConfig[status].label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
