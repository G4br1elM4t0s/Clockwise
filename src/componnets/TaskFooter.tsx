import { useTaskStore } from "../store/task.store"
import { useState, useEffect, useMemo } from "react"
import type { RefObject } from "react"
import { Calendar as CalendarIcon, Clock, Plus, List } from "lucide-react"
// import { VolumeSlider } from "./VolumeSlider"
import { TaskButton } from "./TaskButton"
import Calendar from "./Calendar"
import { TaskList } from "./TaskList"
import { TaskListView } from "./TaskListView"
import { invoke } from "@tauri-apps/api/core"

interface TaskFooterProps {
  onAddClick: () => void
  buttonRef: RefObject<HTMLButtonElement | null>
}

export function TaskFooter({ onAddClick, buttonRef }: TaskFooterProps) {
  const {
    getTodayActiveTasks,
    getTodayActiveTasksWithSessions,
    tasks,
    tasksWithSessions,
    loadTasks,
    loadTasksWithSessions
  } = useTaskStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isTaskListViewOpen, setIsTaskListViewOpen] = useState(false)

  // Get today's tasks - usar dados com sessões quando disponível, excluindo concluídas
  const todayTasks = useMemo(() => {
    const todayTasksWithSessions = getTodayActiveTasksWithSessions()
    return todayTasksWithSessions.length > 0 ? todayTasksWithSessions : getTodayActiveTasks()
  }, [tasksWithSessions, tasks])

  // Estado local para a ordem das tarefas (para drag and drop)
  const [orderedTasks, setOrderedTasks] = useState(todayTasks)

  // Atualizar ordem das tarefas quando todayTasks mudar
  useEffect(() => {
    setOrderedTasks(todayTasks)
  }, [todayTasks])

  const allTasks = useMemo(() => {
    return tasksWithSessions.length > 0 ? tasksWithSessions : tasks
  }, [tasksWithSessions, tasks])

  const datesWithTasks = useMemo(() => {
    return allTasks.map(task => {
      const [year, month, day] = task.scheduled_date.split("-").map(Number)
      return new Date(year, month - 1, day) // month é 0-indexed
    })
  }, [allTasks])

  // Pegar tarefas do dia selecionado
  const getTasksForDate = useMemo(() => {
    return (date: Date) => {
      const dateStr = date.toISOString().split("T")[0]
      return allTasks.filter(task => task.scheduled_date === dateStr)
    }
  }, [allTasks])

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Reload automático removido - só recarrega quando necessário

  const handleDaySelect = (date: Date | undefined) => {
    if (date) {
      const dateStr = date.toISOString().split("T")[0]
      const tasksForDate = allTasks.filter(task => task.scheduled_date === dateStr)

      if (tasksForDate.length > 0) {
        setSelectedDate(date)
      } else {
        setSelectedDate(null)
        setCurrentTime(date)
        setIsCalendarOpen(false)
      }
    }
  }

  const toggleCalendar = async () => {
    if (!isCalendarOpen) {
      await invoke("expand_window_for_modal")
    } else {
      await invoke("reset_window_size")
    }
    setIsCalendarOpen(!isCalendarOpen)
    setSelectedDate(null)
  }

  // Fechar o calendário quando clicar fora
  useEffect(() => {
    const handleClickOutside = async (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const isClickInside =
        target.closest(".calendar-container") || target.closest(".calendar-trigger")
      const isClickOnInput =
        target.tagName.toLowerCase() === "input" || target.tagName.toLowerCase() === "button"

      if (!isClickInside && !isClickOnInput) {
        setIsCalendarOpen(false)
        setSelectedDate(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Observar mudanças no estado do calendário para controlar o resize
  useEffect(() => {
    if (!isCalendarOpen) {
      invoke("reset_window_size")
    }
  }, [isCalendarOpen])

  // Função para recarregar dados das tarefas
  const handleTaskAction = async (taskId: string, action: "start" | "pause") => {
    console.log(`🔄 TaskFooter - Recarregando dados após ação ${action} na tarefa ${taskId}`)
    try {
      // Recarregar dados do backend
      await Promise.all([loadTasks(), loadTasksWithSessions()])
      console.log("✅ TaskFooter - Dados recarregados com sucesso")
    } catch (error) {
      console.error("❌ TaskFooter - Erro ao recarregar dados:", error)
    }
  }

  return (
    <div style={{ padding: "0px 16px" }} className="w-full bg-black text-white ">
      <div className="h-[55px] flex items-center justify-between px-4 backdrop-blur-sm border-t border-[#7F7F7F]">
        {/* Tasks Section */}
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {orderedTasks.length === 0 ? (
              <div className="text-gray-400">Nenhuma tarefa para hoje</div>
            ) : (
              orderedTasks.map((task, index) => (
                <TaskButton
                  key={task.id}
                  task={task}
                  index={index}
                  onDragAction={handleTaskAction}
                />
              ))
            )}
          </div>
        </div>

        {/* System Section with Add Button */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Task List View Button */}
          <button
            onClick={async () => {
              await invoke("expand_window_for_modal")
              setIsTaskListViewOpen(true)
            }}
            className="flex items-center cursor-pointer border border-white rounded-full gap-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/10 transition-colors p-2"
            title="Ver todas as tarefas"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Add Button */}
          <button
            ref={buttonRef}
            onClick={onAddClick}
            className="flex items-center cursor-pointer border border-white rounded-full gap-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/10 transition-colors p-2"
            title="Adicionar nova tarefa"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Volume Control with Slider */}
          {/* <VolumeSlider /> */}

          {/* Date and Time */}
          <div className="flex items-center gap-3 text-sm">
            <div className="relative">
              <div
                className="flex items-center gap-1 cursor-pointer calendar-trigger"
                onClick={toggleCalendar}
              >
                <CalendarIcon className="w-4 h-4 text-[#17FF8B]" />
                <span>
                  {currentTime.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit"
                  })}
                </span>
              </div>

              {isCalendarOpen && (
                <div
                  className="absolute right-[calc(100%-80px)] top-[calc(100%+8px)] z-50 calendar-container"
                  onClick={e => e.stopPropagation()}
                >
                  {selectedDate ? (
                    <TaskList
                      tasks={getTasksForDate(selectedDate)}
                      date={selectedDate}
                      onBack={() => setSelectedDate(null)}
                      onClose={() => {
                        setIsCalendarOpen(false)
                        setSelectedDate(null)
                      }}
                    />
                  ) : (
                    <Calendar
                      selected={currentTime}
                      onSelect={handleDaySelect}
                      highlightedDates={datesWithTasks}
                      onUnmount={
                        !isCalendarOpen
                          ? () => {
                              setIsCalendarOpen(false)
                              setSelectedDate(null)
                            }
                          : undefined
                      }
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-[#17FF8B]" />
              <span className="font-mono">
                {currentTime.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit"
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Task List View Modal */}
      <TaskListView
        isOpen={isTaskListViewOpen}
        onClose={async () => {
          setIsTaskListViewOpen(false)
          await invoke("reset_window_size")
        }}
      />
    </div>
  )
}
