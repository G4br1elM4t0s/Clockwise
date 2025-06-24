import type { Duration } from "./time"

export function formatTimeDisplay(duration: Duration): string {
  const hours = Math.abs(duration.hours)
  const minutes = Math.abs(duration.minutes)
  const seconds = Math.abs(duration.seconds)

  // Sempre formata com dois dígitos
  const formattedHours = String(hours).padStart(2, "0")
  const formattedMinutes = String(minutes).padStart(2, "0")
  const formattedSeconds = String(seconds).padStart(2, "0")

  return `${
    duration.isNegative ? "-" : ""
  }${formattedHours}:${formattedMinutes}:${formattedSeconds}`
}
