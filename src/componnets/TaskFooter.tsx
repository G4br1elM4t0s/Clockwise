import { useTaskStore } from "../store/task.store"
import type { Task as StoreTask } from "../store/task.store"
import { useState, useEffect } from "react"
import {
  Settings,
  Calendar,
  Clock,
  Battery,
  Plus,
  BatteryLow,
  BatteryFull,
  Play,
  Pause
} from "lucide-react"
import { VolumeSlider } from "./VolumeSlider"

interface TimeRemaining {
  hours: number
  minutes: number
  seconds: number
  isNegative: boolean
}

interface TaskFooterProps {
  onAddClick: () => void
}

export function TaskFooter({ onAddClick }: TaskFooterProps) {
  const { getTodayTasks, startTask, pauseTask } = useTaskStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [isCharging, setIsCharging] = useState(false)
  const [isLaptop, setIsLaptop] = useState(false)
  const [elapsedTimes, setElapsedTimes] = useState<{ [key: string]: number }>({})

  // Get today's tasks
  const tasks = getTodayTasks()
  console.log("Tasks from getTodayTasks:", tasks)

  // Find active task
  const activeTask = tasks.find(task => task.status === "in_progress")
  console.log("Active task:", activeTask)

  // Update time and timers every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())

      // Update elapsed time for active task
      if (activeTask?.started_at) {
        setElapsedTimes(prev => {
          const startTime = new Date(activeTask.started_at!).getTime()
          const elapsed = Math.floor((Date.now() - startTime) / 1000)
          return { ...prev, [activeTask.id!]: elapsed }
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [activeTask])

  // Detect if laptop and get battery info
  useEffect(() => {
    const checkBattery = async () => {
      try {
        if ("getBattery" in navigator) {
          const battery = await (navigator as any).getBattery()
          setIsLaptop(true)
          setBatteryLevel(Math.round(battery.level * 100))
          setIsCharging(battery.charging)

          battery.addEventListener("levelchange", () => {
            setBatteryLevel(Math.round(battery.level * 100))
          })
          battery.addEventListener("chargingchange", () => {
            setIsCharging(battery.charging)
          })
        } else {
          setIsLaptop(false)
        }
      } catch (error) {
        console.error("Error checking battery:", error)
        setIsLaptop(false)
      }
    }

    checkBattery()
  }, [])

  const getBatteryIcon = () => {
    if (batteryLevel === null) return null
    if (batteryLevel <= 20) return <BatteryLow className="w-4 h-4 text-red-500" />
    if (batteryLevel >= 90) return <BatteryFull className="w-4 h-4 text-green-500" />
    return <Battery className="w-4 h-4 text-blue-500" />
  }

  const calculateTimeRemaining = (task: StoreTask): TimeRemaining => {
    const totalSeconds = task.estimated_hours * 3600

    if (task.status !== "in_progress" || !task.started_at) {
      return {
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
        isNegative: false
      }
    }

    const elapsedSeconds = elapsedTimes[task.id!] || 0
    const remainingSeconds = totalSeconds - elapsedSeconds

    if (remainingSeconds >= 0) {
      return {
        hours: Math.floor(remainingSeconds / 3600),
        minutes: Math.floor((remainingSeconds % 3600) / 60),
        seconds: remainingSeconds % 60,
        isNegative: false
      }
    } else {
      const overSeconds = Math.abs(remainingSeconds)
      return {
        hours: Math.floor(overSeconds / 3600),
        minutes: Math.floor((overSeconds % 3600) / 60),
        seconds: overSeconds % 60,
        isNegative: true
      }
    }
  }

  const handleStartTask = async (taskId: string) => {
    try {
      if (activeTask && activeTask.id !== taskId) {
        alert("Você já tem uma tarefa em andamento. Pause-a primeiro.")
        return
      }

      await startTask(taskId)
      setElapsedTimes(prev => ({
        ...prev,
        [taskId]: 0
      }))
    } catch (error) {
      console.error("Error starting task:", error)
    }
  }

  const handlePauseTask = async (taskId: string) => {
    try {
      await pauseTask(taskId)
      setElapsedTimes(prev => {
        const newTimes = { ...prev }
        delete newTimes[taskId]
        return newTimes
      })
    } catch (error) {
      console.error("Error pausing task:", error)
    }
  }

  const formatTimeDisplay = (time: TimeRemaining) => {
    const sign = time.isNegative ? "-" : ""
    const hours = Math.floor(time.hours).toString().padStart(2, "0")
    const minutes = time.minutes.toString().padStart(2, "0")
    return `${sign}${hours}:${minutes}`
  }

  return (
    <div className="w-full bg-black text-white">
      <div className="h-[55px] flex items-center justify-between px-4 backdrop-blur-sm border-t border-[#7F7F7F]">
        {/* Tasks Section */}
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tasks.length === 0 ? (
              <div className="text-gray-400">Nenhuma tarefa para hoje</div>
            ) : (
              tasks.map(task => {
                const timeRemaining = calculateTimeRemaining(task)
                const isTaskActive = task.status === "in_progress"
                const canStart = !activeTask || activeTask.id === task.id

                return (
                  <div
                    key={task.id}
                    className={`bg-[#7F7F7F] hover:bg-[#7F7F7F]/80 rounded-lg px-3 py-2 flex items-center gap-3 whitespace-nowrap flex-shrink-0 min-w-[200px] transition-colors ${
                      isTaskActive ? "ring-2 ring-[#17FF8B]/50" : ""
                    }`}
                  >
                    {/* Play/Pause Button */}
                    <button
                      onClick={() =>
                        isTaskActive ? handlePauseTask(task.id!) : handleStartTask(task.id!)
                      }
                      disabled={!canStart && !isTaskActive}
                      className={`rounded-full p-1.5 transition-colors flex-shrink-0 ${
                        isTaskActive
                          ? "bg-[#7F7F7F] hover:bg-[#7F7F7F]/80"
                          : canStart
                          ? "bg-[#17FF8B] hover:bg-[#17FF8B]/80"
                          : "bg-gray-500 cursor-not-allowed"
                      }`}
                      title={
                        !canStart && !isTaskActive
                          ? "Pause a tarefa atual primeiro"
                          : isTaskActive
                          ? "Pausar tarefa"
                          : "Iniciar tarefa"
                      }
                    >
                      {isTaskActive ? (
                        <Pause className="w-3 h-3 text-white" />
                      ) : (
                        <Play className="w-3 h-3 text-white" />
                      )}
                    </button>

                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{task.name}</span>
                        <button className="opacity-50 hover:opacity-100 transition-opacity">
                          <Settings className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{task.user}</span>
                        <span>•</span>
                        <span
                          className={`font-mono font-bold ${
                            timeRemaining.isNegative ? "text-red-400" : "text-[#17FF8B]"
                          }`}
                        >
                          {formatTimeDisplay(timeRemaining)}
                        </span>
                        {isTaskActive && (
                          <span className="bg-[#17FF8B] w-2 h-2 rounded-full animate-pulse"></span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* System Section with Add Button */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Add Button */}
          <button
            onClick={onAddClick}
            className="bg-[#17FF8B] hover:bg-[#17FF8B]/80 rounded-full p-2 transition-colors flex-shrink-0"
            title="Adicionar nova tarefa"
          >
            <Plus className="w-4 h-4 text-black" />
          </button>

          {/* Volume Control with Slider */}
          <VolumeSlider />

          {/* Battery (laptop only) */}
          {isLaptop && batteryLevel !== null && (
            <div className="flex items-center gap-2">
              {getBatteryIcon()}
              <span className="text-xs text-gray-300">
                {batteryLevel}%{isCharging && " ⚡"}
              </span>
            </div>
          )}

          {/* Date and Time */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-[#17FF8B]" />
              <span>
                {currentTime.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit"
                })}
              </span>
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
    </div>
  )
}
