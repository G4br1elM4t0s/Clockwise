import { useEffect } from "react"
import { useTaskStore, type PomodoroSessionWithTask } from "../store/task.store"
import { Clock, Play, Pause, CheckCircle, Timer } from "lucide-react"

export function PomodoroSessionsView() {
  const { pomodoroSessions, loadPomodoroSessions } = useTaskStore()

  useEffect(() => {
    loadPomodoroSessions()
  }, [loadPomodoroSessions])

  const getSessionIcon = (sessionType: string, sessionStatus: string) => {
    if (sessionStatus === "active") {
      return <Play className="w-4 h-4 text-[#17FF8B]" />
    }
    if (sessionType === "work") {
      return <Timer className="w-4 h-4 text-blue-400" />
    }
    return <Pause className="w-4 h-4 text-yellow-400" />
  }

  const getStatusIcon = (taskStatus: string) => {
    switch (taskStatus) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-[#17FF8B]" />
      case "in_progress":
        return <Play className="w-4 h-4 text-[#17FF8B]" />
      case "paused":
        return <Pause className="w-4 h-4 text-orange-400" />
      case "waiting":
        return <Clock className="w-4 h-4 text-yellow-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}min`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // Agrupar sessões por tarefa
  const groupedSessions = pomodoroSessions.reduce((acc, session) => {
    const key = `${session.task_id}-${session.task_name}`
    if (!acc[key]) {
      acc[key] = {
        task: {
          id: session.task_id,
          name: session.task_name,
          user: session.task_user,
          status: session.task_status,
          scheduled_date: session.scheduled_date,
          estimated_hours: session.estimated_hours
        },
        sessions: []
      }
    }
    acc[key].sessions.push(session)
    return acc
  }, {} as Record<string, { task: any; sessions: PomodoroSessionWithTask[] }>)

  return (
    <div className="p-6 bg-[#1a1a1a] text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-[#17FF8B]">
          Sessões Pomodoro - Visão Completa
        </h1>

        <div className="grid gap-6">
          {Object.entries(groupedSessions).map(([key, { task, sessions }]) => (
            <div key={key} className="bg-[#2a2a2a] rounded-lg p-6">
              {/* Header da Tarefa */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-600">
                <div className="flex items-center gap-3">
                  {getStatusIcon(task.status)}
                  <div>
                    <h3 className="text-lg font-semibold">{task.name}</h3>
                    <p className="text-sm text-gray-400">
                      {task.user} • {formatDate(task.scheduled_date)} • {task.estimated_hours}h
                      estimadas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      task.status === "completed"
                        ? "bg-[#17FF8B] text-black"
                        : task.status === "in_progress"
                        ? "bg-blue-500 text-white"
                        : task.status === "waiting"
                        ? "bg-yellow-500 text-black"
                        : task.status === "paused"
                        ? "bg-red-500 text-white"
                        : "bg-gray-500 text-white"
                    }`}
                  >
                    {task.status}
                  </div>
                </div>
              </div>

              {/* Lista de Sessões */}
              <div className="grid gap-3">
                <div className="grid grid-cols-8 gap-4 text-xs font-medium text-gray-400 px-4">
                  <div>#</div>
                  <div>Tipo</div>
                  <div>Duração</div>
                  <div>Status</div>
                  <div>Iniciado em</div>
                  <div>Progresso</div>
                  <div>Criado em</div>
                  <div>ID</div>
                </div>

                {sessions.map(session => (
                  <div
                    key={session.pomodoro_id}
                    className={`grid grid-cols-8 gap-4 items-center p-4 rounded-lg transition-colors ${
                      session.session_status === "active"
                        ? "bg-[#17FF8B]/10 border border-[#17FF8B]/30"
                        : "bg-[#3a3a3a] hover:bg-[#4a4a4a]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{session.session_number}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getSessionIcon(session.session_type, session.session_status)}
                      <span className="text-sm capitalize">
                        {session.session_type === "work" ? "Trabalho" : "Pausa"}
                      </span>
                    </div>

                    <div className="text-sm font-mono">
                      {formatDuration(session.duration_seconds)}
                    </div>

                    <div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.session_status === "active"
                            ? "bg-[#17FF8B] text-black"
                            : session.session_status === "waiting"
                            ? "bg-gray-500 text-white"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {session.session_status === "active"
                          ? "Ativa"
                          : session.session_status === "waiting"
                          ? "Aguardando"
                          : "Completa"}
                      </span>
                    </div>

                    <div className="text-sm text-gray-400">
                      {session.session_started_at
                        ? formatDateTime(session.session_started_at)
                        : "-"}
                    </div>

                    <div className="text-xs">
                      {session.session_status === "active" ? (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-[#17FF8B] rounded-full animate-pulse"></div>
                          <span className="text-[#17FF8B]">Em andamento</span>
                        </div>
                      ) : session.session_started_at ? (
                        <span className="text-green-400">✓ Concluída</span>
                      ) : (
                        <span className="text-gray-500">Pendente</span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      {formatDateTime(session.pomodoro_created_at)}
                    </div>

                    <div className="text-xs font-mono text-gray-500">#{session.pomodoro_id}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {pomodoroSessions.length === 0 && (
          <div className="text-center py-12">
            <Timer className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Nenhuma sessão Pomodoro encontrada
            </h3>
            <p className="text-gray-500">
              As sessões Pomodoro aparecerão aqui quando você iniciar uma tarefa
            </p>
          </div>
        )}

        <div className="mt-8 p-4 bg-[#2a2a2a] rounded-lg">
          <h4 className="font-medium mb-2 text-[#17FF8B]">Legenda:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-blue-400" />
                <span>Sessão de Trabalho (25min)</span>
              </div>
              <div className="flex items-center gap-2">
                <Pause className="w-4 h-4 text-yellow-400" />
                <span>Sessão de Pausa (5min/15min)</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-[#17FF8B]" />
                <span>Sessão Ativa</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Sessão Completa</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
