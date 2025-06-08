import { create } from "zustand"
import { invoke } from "@tauri-apps/api/core"

export type Task = {
  id?: string
  name: string
  user: string
  estimated_hours: number
  scheduled_date: string
  status: "pending" | "in_progress" | "completed"
  created_at: string
  started_at: string | null
  completed_at: string | null
}

type TaskStore = {
  tasks: Task[]
  loadTasks: () => Promise<void>
  addTask: (task: Task) => Promise<void>
  startTask: (taskId: string) => Promise<void>
  pauseTask: (taskId: string) => Promise<void>
  completeTask: (taskId: string) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  getTodayTasks: () => Task[]
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],

  loadTasks: async () => {
    try {
      const tasks = await invoke<Task[]>("load_tasks")
      console.log("gabriel aqui:", tasks)
      set({ tasks })
    } catch (error) {
      console.error("Error loading tasks:", error)
    }
  },

  addTask: async (task: Task) => {
    try {
      // Mapear os dados do formulário para o formato que o Rust espera
      const params = {
        name: task.name,
        user: task.user,
        estimatedHours: task.estimated_hours,
        scheduledDate: task.scheduled_date
      }

      console.log("Enviando dados do formulário para o Rust:", params)

      const newTask = await invoke<Task>("add_task", params)

      console.log("Task adicionada com sucesso:", newTask)
      set(state => ({ tasks: [...state.tasks, newTask] }))
    } catch (error) {
      console.error("Erro detalhado ao chamar add_task no Rust:", error)
      throw error
    }
  },

  startTask: async (taskId: string) => {
    try {
      const updatedTask = await invoke<Task>("start_task", { taskId })
      set(state => ({
        tasks: state.tasks.map(task => (task.id === taskId ? updatedTask : task))
      }))
    } catch (error) {
      console.error("Error starting task:", error)
    }
  },

  pauseTask: async (taskId: string) => {
    try {
      const updatedTask = await invoke<Task>("pause_task", { taskId })
      set(state => ({
        tasks: state.tasks.map(task => (task.id === taskId ? updatedTask : task))
      }))
    } catch (error) {
      console.error("Error pausing task:", error)
    }
  },

  completeTask: async (taskId: string) => {
    try {
      const updatedTask = await invoke<Task>("complete_task", { taskId })
      set(state => ({
        tasks: state.tasks.map(task => (task.id === taskId ? updatedTask : task))
      }))
    } catch (error) {
      console.error("Error completing task:", error)
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      await invoke("delete_task", { taskId })
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== taskId)
      }))
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  },

  getTodayTasks: () => {
    const today = new Date().toISOString().split("T")[0]
    const todayTasks = get().tasks.filter(task => task.scheduled_date === today)
    console.log("Today's tasks:", todayTasks)
    return todayTasks
  }
}))
