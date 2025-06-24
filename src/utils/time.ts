import type { Task } from "../store/task.store"

export interface Duration {
  hours: number
  minutes: number
  seconds: number
  isNegative: boolean
}

export function calculateTimeRemaining(task: Task): Duration {
  // Esta função agora é apenas para compatibilidade
  // O tempo real deve ser calculado via getTaskRemainingTime do backend
  const estimatedSeconds = task.estimated_hours * 3600
  const isNegative = estimatedSeconds < 0

  const absSeconds = Math.abs(estimatedSeconds)
  const hours = Math.floor(absSeconds / 3600)
  const minutes = Math.floor((absSeconds % 3600) / 60)
  const seconds = Math.floor(absSeconds % 60)

  return {
    hours,
    minutes,
    seconds,
    isNegative
  }
}

export function secondsToDuration(totalSeconds: number): Duration {
  const isNegative = totalSeconds < 0
  const absSeconds = Math.abs(totalSeconds)
  const hours = Math.floor(absSeconds / 3600)
  const minutes = Math.floor((absSeconds % 3600) / 60)
  const seconds = Math.floor(absSeconds % 60)

  return {
    hours,
    minutes,
    seconds,
    isNegative
  }
}
