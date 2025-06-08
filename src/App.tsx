import { useEffect, useState } from "react"
import { useTaskStore } from "./store/task.store"
import { TaskFooter } from "./componnets/TaskFooter"
import { TaskModal } from "./componnets/TaskModal"
import { invoke } from "@tauri-apps/api/core"

function App() {
  const loadTasks = useTaskStore(state => state.loadTasks)
  const tasks = useTaskStore(state => state.tasks)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const init = async () => {
      await loadTasks()
    }
    init()
  }, [])

  const handleOpenModal = async () => {
    try {
      setIsModalOpen(true)
    } catch (error) {
      console.error("Error opening modal:", error)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <div className="fixed top-0 left-0 right-0">
      <TaskFooter onAddClick={handleOpenModal} />
      <TaskModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  )
}

export default App
