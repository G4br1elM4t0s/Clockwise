# Sistema de Tempo Regressivo - ClockWise

## Visão Geral

O sistema foi refatorado para incluir um controle de tempo regressivo preciso e baseado em períodos reais de trabalho. Cada tarefa agora rastreia automaticamente quando foi iniciada, pausada, retomada e completada.

## Funcionalidades Implementadas

### 🎯 Controle de Estado das Tarefas

- **pending**: Tarefa criada, aguardando início
- **in_progress**: Tarefa em andamento (cronômetro ativo)
- **paused**: Tarefa pausada (cronômetro parado)
- **completed**: Tarefa finalizada

### 📊 Rastreamento de Tempo Real

- Nova tabela `task_time_logs` que registra cada período de trabalho
- Campos: `id`, `task_id`, `started_at`, `ended_at`
- Cálculo dinâmico baseado na soma de todos os intervalos trabalhados

### ⏱️ Cálculo Preciso

```
tempo_restante = (estimated_hours * 3600) - soma_dos_intervalos_trabalhados
```

- Suporte a tempo **negativo** quando estimativa é ultrapassada
- Atualização em tempo real durante trabalho ativo

## API Backend (Rust/Tauri)

### Funções Principais

#### `start_task(task_id: i64)`

- Inicia uma nova sessão de trabalho
- Cria novo registro em `task_time_logs` com `started_at`
- Atualiza status da task para `in_progress`
- **Validação**: Impede múltiplas sessões ativas simultâneas

#### `pause_task(task_id: i64)`

- Finaliza a sessão ativa atual
- Preenche `ended_at` do log ativo
- Atualiza status da task para `paused`

#### `resume_task(task_id: i64)`

- Retoma uma tarefa pausada
- Cria novo registro em `task_time_logs`
- Atualiza status para `in_progress`
- **Validação**: Só permite retomar tarefas pausadas

#### `complete_task(task_id: i64)`

- Finaliza a tarefa permanentemente
- Preenche `ended_at` do log ativo (se houver)
- Atualiza status para `completed`

#### `get_task_remaining_time(task_id: i64) -> i64`

- Calcula tempo restante em segundos
- Soma todos os intervalos trabalhados
- Retorna valor que pode ser negativo
- **Performance**: Cálculo dinâmico sem armazenamento de estado

## API Frontend (TypeScript)

### Store Atualizado

```typescript
type Task = {
  id?: string
  name: string
  user: string
  estimated_hours: number
  scheduled_date: string
  status: "pending" | "in_progress" | "paused" | "completed"
  created_at: string
  started_at: string | null
  completed_at: string | null
}
```

### Funções do Store

```typescript
const {
  startTask, // Inicia uma tarefa
  pauseTask, // Pausa tarefa ativa
  resumeTask, // Retoma tarefa pausada
  completeTask, // Finaliza tarefa
  getTaskRemainingTime // Obtém tempo restante
} = useTaskStore()
```

### Utilitários de Tempo

```typescript
// Converte segundos para formato Duration
function secondsToDuration(totalSeconds: number): Duration

// Para compatibilidade (usar getTaskRemainingTime é preferível)
function calculateTimeRemaining(task: Task): Duration
```

## Componente TaskButton

### Integração Completa

- **Estado Automático**: Sincronizado com status da task
- **Drag & Drop**: Arrastar direita = iniciar/retomar, esquerda = pausar
- **Timer Real**: Atualização baseada no tempo real do backend
- **Auto-Complete**: Finaliza automaticamente quando tempo chegar a zero

### Fluxo de Uso

1. **Arrastar para direita** → Inicia ou retoma a tarefa
2. **Arrastar para esquerda** → Pausa a tarefa
3. **Tempo zerado** → Completa automaticamente
4. **Status visual** → Cores indicam estado atual

## Banco de Dados

### Tabela `tasks` (existente)

```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user TEXT NOT NULL,
    estimated_hours REAL NOT NULL,
    scheduled_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    started_at TEXT,
    completed_at TEXT
);
```

### Tabela `task_time_logs` (nova)

```sql
CREATE TABLE task_time_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
);
```

## Exemplo de Uso

```typescript
// Obter tempo restante de uma tarefa
const remainingSeconds = await getTaskRemainingTime("123")
const duration = secondsToDuration(remainingSeconds)

console.log(`Tempo restante: ${formatTimeDisplay(duration)}`)
// Output: "02:30:15" ou "-00:15:30" (se passou do tempo)

// Controlar uma tarefa
await startTask("123") // Inicia
await pauseTask("123") // Pausa
await resumeTask("123") // Retoma
await completeTask("123") // Finaliza
```

## Benefícios

✅ **Precisão**: Baseado em timestamps reais, não em contadores locais
✅ **Persistência**: Dados salvos no banco, resistente a reinicializações
✅ **Flexibilidade**: Suporte a múltiplas sessões de trabalho por tarefa
✅ **Validação**: Previne estados inconsistentes
✅ **Performance**: Cálculo eficiente sob demanda
✅ **Tempo Negativo**: Rastreia ultrapassagem de estimativas

## Compatibilidade

O sistema mantém compatibilidade com a estrutura existente, apenas adicionando as novas funcionalidades. Todas as funções antigas continuam funcionando normalmente.
