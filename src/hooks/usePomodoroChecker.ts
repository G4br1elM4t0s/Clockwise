import { useEffect, useRef } from "react"
import { useTaskStore } from "../store/task.store"

export function usePomodoroChecker(intervalMs: number = 5000) {
  const { checkPomodoroSessions, loadTasks, loadTasksWithSessions } = useTaskStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Iniciar verificação periódica
    intervalRef.current = setInterval(async () => {
      try {
        const advancedTasks = await checkPomodoroSessions()
        if (advancedTasks.length > 0) {
          console.log(`Pomodoro: ${advancedTasks.length} tarefas avançaram ciclo`)
          // Recarregar dados imediatamente após mudanças
          await Promise.all([loadTasks(), loadTasksWithSessions()])
        }
      } catch (error) {
        console.error("Erro ao verificar sessões Pomodoro:", error)
      }
    }, intervalMs)

    // Cleanup ao desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkPomodoroSessions, loadTasks, loadTasksWithSessions, intervalMs])

  // Função para verificação manual
  const checkNow = async () => {
    try {
      const advancedTasks = await checkPomodoroSessions()
      if (advancedTasks.length > 0) {
        // Recarregar dados após verificação manual
        await Promise.all([loadTasks(), loadTasksWithSessions()])
      }
      return advancedTasks
    } catch (error) {
      console.error("Erro ao verificar sessões Pomodoro:", error)
      return []
    }
  }

  return { checkNow }
}
