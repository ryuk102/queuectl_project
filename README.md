# QueueCTL — CLI-Based Background Job Queue System

A Node.js + MongoDB powered command-line job queue system that supports:
- Enqueuing and managing background jobs
- Running multiple worker processes
- Automatic retry with exponential backoff
- Dead Letter Queue (DLQ) for permanently failed jobs
- Persistent job storage
- Configurable retry/backoff settings

## 1. Setup Instructions

### Prerequisites
- Node.js v18+
- npm v9+
- MongoDB Community Server (running locally on port 27017)
- VS Code Terminal / CMD / PowerShell

### Installation
```bash
git clone https://github.com/ryuk102/queuectl.git
cd queuectl
npm install
```

### Environment Variables
Create a `.env` file in the project root:

```
MONGO_URI=mongodb://127.0.0.1:27017/queuectl
MAX_RETRIES=3
BACKOFF_BASE=2
```

### Start MongoDB

If installed as a service (recommended):
```bash
net start MongoDB
```

If running manually:
```bash
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
```

### Verify MongoDB Connection
```bash
node -e "import('mongoose').then(async m=>{await m.default.connect('mongodb://127.0.0.1:27017/queuectl');console.log('MongoDB Connected');process.exit();})"
```

Output:
```
MongoDB Connected
```

## 2. CLI Usage Examples

### Enqueue a Job

PowerShell (VS Code Terminal):
```powershell
$json = @'
{
  "id": "job1",
  "command": "sleep 2"
}
'@
node src/cli/queuectl.js enqueue ($json.Trim())
```

CMD alternative:
```cmd
node src/cli/queuectl.js enqueue "{\"id\":\"job1\",\"command\":\"sleep 2\"}"
```

Output:
```
MongoDB connected successfully
Enqueued job: job1
```

### Start Workers
```bash
node src/cli/queuectl.js worker:start --count 3
```

Output:
```
Starting 3 worker(s)...
Worker 1 executing job job1...
Job job1 completed
```

### Stop Workers Gracefully
```bash
node src/cli/queuectl.js worker:stop
```

Output:
```
Stopping workers gracefully...
```

### Show Queue Status
```bash
node src/cli/queuectl.js status
```
Example:
```json
{
  "activeWorkers": 3,
  "totalJobs": 5,
  "jobStates": [
    { "_id": "completed", "count": 4 },
    { "_id": "pending", "count": 1 }
  ]
}
```

### List Jobs
```bash
node src/cli/queuectl.js list
node src/cli/queuectl.js list --state pending
node src/cli/queuectl.js list --state completed
```

Example:
```
┌─────────┬────────────┬──────────────────┬──────────────┐
│ (index) │ id         │ command          │ state        │
├─────────┼────────────┼──────────────────┼──────────────┤
│ 0       │ job1       │ sleep 2          │ completed    │
└─────────┴────────────┴──────────────────┴──────────────┘
```

### Dead Letter Queue (DLQ)

List DLQ Jobs:
```bash
node src/cli/queuectl.js dlq:list
```

Example:
```
┌─────────┬────────────┬──────────────────┬────────┐
│ (index) │ id         │ command          │ state  │
├─────────┼────────────┼──────────────────┼────────┤
│ 0       │ job5       │ invalidCommand   │ dead   │
└─────────┴────────────┴──────────────────┴────────┘
```

Retry a DLQ Job:
```bash
node src/cli/queuectl.js dlq:retry job5
```
Output:
```
Retried job: job5
```

### Configuration Commands

Show Config:
```bash
node src/cli/queuectl.js config:show
```
Output:
```json
{
  "max_retries": 3,
  "backoff_base": 2
}
```

Set Config:
```bash
node src/cli/queuectl.js config:set max_retries 5
```
Output:
```
Config updated: { max_retries: 5, backoff_base: 2 }
```

## 3. Architecture Overview

### Design Pattern: MVC (Model–View–Controller)

```
src/
├── config/
│   ├── db.js
│   └── configStore.js
├── controllers/
│   ├── jobController.js
│   ├── workerController.js
│   ├── dlqController.js
│   └── configController.js
├── models/
│   └── Job.js
├── services/
│   ├── jobService.js
│   ├── workerService.js
│   ├── retryService.js
│   ├── dlqService.js
│   └── configService.js
└── cli/
    └── queuectl.js
```

### Data Persistence
All jobs are stored in a MongoDB collection (`queuectl.jobs`). Jobs survive restarts — even after MongoDB or the CLI restarts.

### Worker Logic
- Workers continuously pick pending jobs (`state = "pending"`).
- Execute `job.command` via `child_process.exec()`.
- On success → `state = "completed"`.
- On failure → retry after exponential delay (`base^attempts`).
- When `attempts >= max_retries` → job moves to the Dead Letter Queue (DLQ).

## 4. Assumptions & Trade-offs

| Area | Decision | Trade-off |
|------|-----------|-----------|
| Storage | MongoDB for persistence | Requires MongoDB service running |
| Concurrency | Parallel workers via async loops | Limited by Node process; no distributed workers yet |
| Retry Policy | Exponential backoff | Simple but not dynamic |
| DLQ Handling | Manual retry via CLI | No automatic requeue mechanism |
| Command Execution | Uses child_process.exec() | No job output logging yet |
| CLI Input Parsing | JSON-based commands | PowerShell escaping issues mitigated with .Trim() |

## 5. Verification & Testing

### Automated Tests
```bash
npm test
```

Output:
```
QueueCTL CLI Job System
  ✓ should enqueue a new job
  ✓ should list all jobs
2 passing (1s)
```

### Manual Verification
1. Enqueue Jobs - `node src/cli/queuectl.js enqueue ...`
2. Start Workers - `node src/cli/queuectl.js worker:start --count 2`
3. Check Status - `node src/cli/queuectl.js status`
4. Stop Workers - `node src/cli/queuectl.js worker:stop`
5. View Completed Jobs - `node src/cli/queuectl.js list --state completed`
6. Check DLQ - `node src/cli/queuectl.js dlq:list`
7. Retry DLQ Job - `node src/cli/queuectl.js dlq:retry <jobId>`

## Example Lifecycle Flow

| Stage | Description | Example State |
|--------|--------------|---------------|
| Enqueued | Job added to queue | pending |
| Picked by Worker | Worker executes job | processing |
| Success | Command executed successfully | completed |
| Failure | Retry triggered after delay | failed |
| DLQ | Retries exhausted | dead |
