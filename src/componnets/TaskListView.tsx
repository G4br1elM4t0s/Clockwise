import { useState, useEffect } from "react"
import { useTaskStore, type Task } from "../store/task.store"
import { TaskFilter } from "./TaskFilter"
import { TaskCard } from "./TaskCard"
import { Filter, X, Search } from "lucide-react"

interface TaskListViewProps {
  isOpen: boolean
  onClose: () => void
}

export function TaskListView({ isOpen, onClose }: TaskListViewProps) {
  const { tasks, loadTasks } = useTaskStore()
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Atualizar tarefas filtradas quando tasks mudar
  useEffect(() => {
    setFilteredTasks(tasks)
  }, [tasks])

  // Recarregar tarefas quando o componente abrir
  useEffect(() => {
    if (isOpen) {
      loadTasks()
    }
  }, [isOpen, loadTasks])

  // Aplicar filtro de busca por nome
  const searchFilteredTasks = filteredTasks.filter(task =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleFilterChange = (newFilteredTasks: Task[]) => {
    setFilteredTasks(newFilteredTasks)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-zinc-900 rounded-3xl shadow-xl w-[90vw] max-w-6xl h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-zinc-100">Todas as Tarefas</h2>
            <span className="text-sm text-gray-400">
              {searchFilteredTasks.length} de {tasks.length} tarefas
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Botão de filtro */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${
                isFilterOpen
                  ? "bg-[#17FF8B]/20 text-[#17FF8B]"
                  : "bg-zinc-700/50 text-gray-300 hover:bg-zinc-700"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filtros</span>
            </button>

            {/* Botão fechar */}
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(100%-81px)]">
          {/* Painel de filtros (lateral) */}
          {isFilterOpen && (
            <div className="w-80 border-r border-zinc-700 p-4">
              <TaskFilter
                onFilterChange={handleFilterChange}
                isOpen={true}
                onClose={() => setIsFilterOpen(false)}
                embedded={true}
              />
            </div>
          )}

          {/* Conteúdo principal */}
          <div className="flex-1 flex flex-col">
            {/* Barra de busca */}
            <div className="p-4 border-b border-zinc-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar tarefas por nome..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-[#17FF8B]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Lista de tarefas */}
            <div className="flex-1 overflow-y-auto p-4">
              {searchFilteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-medium mb-2">Nenhuma tarefa encontrada</h3>
                  <p className="text-sm text-center">
                    {searchTerm
                      ? `Nenhuma tarefa corresponde à busca "${searchTerm}"`
                      : "Tente ajustar os filtros ou criar uma nova tarefa"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {searchFilteredTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
