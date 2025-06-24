# Sistema Pomodoro Automático - ClockWise

## Visão Geral

O sistema foi estendido para incluir controle automático de Pomodoro com base em ciclos pré-definidos. Cada tarefa agora segue automaticamente o método Pomodoro tradicional: 25min trabalho → 5min pausa → repetir 4x → 15min pausa longa.

## Funcionalidades Implementadas

### 🍅 Ciclo Pomodoro Automático

- **Ciclo Padrão**: 25min trabalho, 5min pausa, repetir 4x, depois 15min pausa longa
- **8 Sessões por Tarefa**: 4 períodos de trabalho + 4 pausas (incluindo pausa longa)
- **Controle Automático**: Status muda baseado no tipo da sessão atual

### 📊 Novos Status de Tarefas

- **pending**: Tarefa criada, aguardando início
- **in_progress**: Período de trabalho ativo (cronômetro + time logs)
- **waiting**: Período de pausa ativo (apenas cronômetro Pomodoro)
- **paused**: Sessão interrompida manualmente
- **completed**: Todos os ciclos Pomodoro finalizados

### 🔄 Transições Automáticas

- **work** → **break**: Após 25min de trabalho
- **break** → **work**: Após 5min de pausa
- **work** → **long_break**: Após 4º período de trabalho
- **long_break** → **completed**: Após pausa longa (15min)

## Estrutura de Banco de Dados

### Nova Tabela: `pomodoro_sessions`

```sql
CREATE TABLE pomodoro_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    session_number INTEGER NOT NULL,        -- 1-8
    session_type TEXT NOT NULL,             -- "work" ou "break"
    duration_seconds INTEGER NOT NULL,      -- 1500 (25min) ou 300 (5min) ou 900 (15min)
    created_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
);
```

### Nova Tabela: `active_sessions`

```sql
CREATE TABLE active_sessions (
    task_id INTEGER PRIMARY KEY,            -- Uma sessão ativa por tarefa
    pomodoro_id INTEGER NOT NULL,           -- Referência à sessão atual
    started_at TEXT NOT NULL,               -- Quando iniciou
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
    FOREIGN KEY (pomodoro_id) REFERENCES pomodoro_sessions (id) ON DELETE CASCADE
);
```

## API Backend (Rust/Tauri)

### Funções Principais

#### `create_pomodoro_cycles(task_id: i64)`

- Cria automaticamente 8 sessões Pomodoro para nova tarefa
- Chamada na primeira vez que `start_task` é executado

#### `get_next_pomodoro_session(task_id: i64) -> Option<PomodoroSession>`

- Busca próxima sessão disponível (menor `session_number`)
- Retorna `None` quando todos os ciclos foram concluídos

#### `start_pomodoro_session(task_id, pomodoro_session) -> String`

- Insere registro em `active_sessions`
- Define status baseado no tipo: `work` → `in_progress`, `break` → `waiting`

#### `check_and_advance_pomodoro_sessions() -> Vec<i64>`

- **Função Principal**: Verifica se sessões ultrapassaram tempo
- Avança automaticamente para próximo ciclo
- Retorna IDs das tarefas que mudaram de estado

### Comandos Tauri Atualizados

#### `start_task(task_id: i64)`

- Busca próxima sessão Pomodoro
- Inicia sessão automaticamente
- Cria `task_time_logs` apenas para períodos de trabalho

#### `pause_task(task_id: i64)`

- Remove sessão de `active_sessions` (interrompe Pomodoro)
- Finaliza `task_time_logs` ativo
- Status → `paused`

#### `resume_task(task_id: i64)`

- Busca próxima sessão disponível
- Reinicia ciclo Pomodoro do ponto onde parou

#### `check_pomodoro_sessions() -> Vec<i64>`

- **Comando Exposto**: Permite verificação manual/periódica
- Frontend pode chamar para atualizar em tempo real

#### `load_tasks_with_sessions() -> Vec<TaskWithActiveSession>`

- Retorna tarefas com informações da sessão ativa
- Inclui `active_session: { session_type, started_at, ends_at, duration_seconds }`

## API Frontend (TypeScript)

### Tipos Atualizados

```typescript
export type Task = {
  // ... campos existentes
  status: "pending" | "in_progress" | "paused" | "waiting" | "completed"
}

export type ActiveSessionInfo = {
  session_type: "work" | "break"
  started_at: string
  ends_at: string
  duration_seconds: number
}

export type TaskWithActiveSession = Task & {
  active_session?: ActiveSessionInfo | null
}
```

### Store Functions

```typescript
const {
  loadTasksWithSessions, // Carrega com info de sessão
  checkPomodoroSessions, // Verifica/avança ciclos
  getTodayTasksWithSessions // Tasks de hoje com sessões
} = useTaskStore()
```

### Hook de Verificação Automática

```typescript
// hooks/usePomodoroChecker.ts
export function usePomodoroChecker(intervalMs: number = 5000)

// App.tsx
usePomodoroChecker(5000) // Verifica a cada 5 segundos
```

## Fluxo de Uso Completo

### 1. Iniciar Nova Tarefa

```typescript
await startTask("123")
```

- ✅ Cria 8 sessões Pomodoro automaticamente
- ✅ Inicia primeira sessão (work, 25min)
- ✅ Status → `in_progress`
- ✅ Cria `task_time_logs` ativo

### 2. Progressão Automática

```typescript
// Verificação a cada 5s (automática)
const advancedTasks = await checkPomodoroSessions()
```

- ✅ Após 25min: work → break (5min)
- ✅ Status → `waiting`
- ✅ Finaliza `task_time_logs`
- ✅ Após 5min: break → work (25min)
- ✅ Status → `in_progress`
- ✅ Cria novo `task_time_logs`

### 3. Pausar Manualmente

```typescript
await pauseTask("123")
```

- ✅ Remove `active_sessions` (interrompe Pomodoro)
- ✅ Status → `paused`
- ✅ Preserva progresso dos ciclos

### 4. Retomar

```typescript
await resumeTask("123")
```

- ✅ Inicia próxima sessão disponível
- ✅ Status baseado no tipo da sessão

### 5. Finalização Automática

- ✅ Após 8ª sessão (pausa longa): Status → `completed`
- ✅ Remove `active_sessions`
- ✅ Finaliza `task_time_logs` se ativo

## Componentes Atualizados

### TaskCard.tsx

- ✅ Suporte ao status `waiting` (amarelo)
- ✅ Botões específicos para cada status
- ✅ Cores visuais diferenciadas

### TaskList.tsx

- ✅ Ícone para status `waiting`
- ✅ Cor amarela para período de pausa

### TaskButton.tsx

- ✅ Compatível com sistema Pomodoro
- ✅ Mantém funcionalidade de drag & drop

## Benefícios

✅ **Automação**: Ciclos Pomodoro seguem automaticamente sem intervenção
✅ **Flexibilidade**: Possibilidade de pausar/retomar a qualquer momento
✅ **Rastreamento Preciso**: `task_time_logs` apenas para períodos produtivos
✅ **Visibilidade**: Status visual claro do tipo de sessão atual
✅ **Integração**: Funciona com sistema de tempo existente
✅ **Performance**: Verificação eficiente com atualizações sob demanda

## Compatibilidade

O sistema mantém **100% de compatibilidade** com funcionalidades existentes:

- ✅ Cálculo de tempo restante baseado em `task_time_logs`
- ✅ Drag & drop no TaskButton
- ✅ Todos os comandos Tauri existentes
- ✅ Interface de usuário atual

**Diferencial**: Adiciona controle automático de ciclos Pomodoro sem quebrar nada que já funcionava.
