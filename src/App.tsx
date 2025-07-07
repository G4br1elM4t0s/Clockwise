import { useEffect, useState, useRef } from "react"
import { useTaskStore } from "./store/task.store"
import { TaskFooter } from "./componnets/TaskFooter"
import { TaskModal } from "./componnets/TaskModal"
import { usePomodoroChecker } from "./hooks/usePomodoroChecker"
import { invoke } from "@tauri-apps/api/core"

function App() {
  const { loadTasks, loadTasksWithSessions } = useTaskStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Verificador automático de sessões Pomodoro
  usePomodoroChecker(5000) // Verifica a cada 5 segundos

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadTasks(), loadTasksWithSessions()])
    }
    init()
  }, [])

  const handleOpenModal = async () => {
    try {
      await invoke("expand_window_for_modal")
      setIsModalOpen(true)
    } catch (error) {
      console.error("Error opening modal:", error)
    }
  }

  const handleCloseModal = async () => {
    await invoke("reset_window_size")
    setIsModalOpen(false)
  }

  // Fechar o modal quando clicar fora
  useEffect(() => {
    const handleClickOutside = async (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isModalOpen && !target.closest(".task-modal")) {
        await handleCloseModal()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isModalOpen])

  return (
    <div className="fixed top-0 left-0 right-0 ">
      <TaskFooter onAddClick={handleOpenModal} buttonRef={buttonRef} isModalOpen={isModalOpen} />
      <TaskModal isOpen={isModalOpen} onClose={handleCloseModal} anchorEl={buttonRef} />
    </div>
  )
}

export default App
