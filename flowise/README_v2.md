# Flowise Agentflow Integration Guide

## ✅ Native Flowise v2 JSON Schema

The `agentic_flow_v2_native.json` file is a **properly structured Flowise v2 agentflow import** that matches the ReactFlow native schema used by Flowise. This file **can be imported directly** into Flowise UI.

### File Structure
- **`agentic_flow_v2_native.json`**: ✅ **Use this** – Native Flowise v2 JSON (ReactFlow format)
  - Compatible with Flowise UI agentflow canvas
  - Direct import ready
  - Contains 6 nodes demonstrating complete escalation workflow
- **`agentic_flow_manual_build.md`**: Reference guide for custom modifications

## Quick Start

### Option 1: Import Native JSON (Recommended)
1. Open Flowise UI → Navigate to **Agentflows**
2. Click **Add New** → Select **Upload Template** or paste JSON
3. Select `agentic_flow_v2_native.json`
4. ✅ Flow should render with all nodes connected

### Option 2: Manual Canvas Build
1. Flowise UI → **Agentflows** → **Add New Canvas**
2. Follow [agentic_flow_manual_build.md](./agentic_flow_manual_build.md) to add nodes and connections
3. Configure node inputs (URLs, headers, code snippets)

## Architecture Overview

### Escalation Workflow
```
Escalation Trigger
    ↓
Fetch Trainees → GET /api/manager/trainees
    ↓
Check Incomplete (Condition: incomplete.length > 0)
    ├─ TRUE (incomplete found)
    │   ↓
    │   Prepare Data (format for email)
    │   ↓
    │   Send Escalation → POST /api/manager/flowise/proxy
    │
    └─ FALSE (all complete)
        ↓
        No Action (return completion message)
```

### Node Details
| Node | Type | Purpose |
|------|------|---------|
| **Escalation Trigger** | startAgentflow | Workflow entry point (manual/webhook/schedule) |
| **Fetch Trainees** | httpAgentflow | GET trainee data from app API |
| **Check Incomplete** | conditionAgentflow | Route based on incomplete trainee count |
| **Prepare Data** | customFunctionAgentflow | Transform JSON for email payload |
| **Send Escalation** | httpAgentflow | POST to app proxy endpoint |
| **No Action** | directReplyAgentflow | End path when all trainees complete |

### App Integration Points
- **`/api/manager/trainees`**: Returns `{ incomplete: [...], scores: {...} }`
- **`/api/manager/flowise/proxy`**: Receives escalation payload, sends SMTP email
- **SMTP Configuration**: Requires `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` env vars
- **Flowise host policy**: If Flowise blocks `localhost`/local IP calls, set `HTTP_ALLOW_LIST=localhost,127.0.0.1` in your Flowise environment and restart Flowise.

## Flowise JSON Schema Reference

### Flow Root Structure
```json
{
  "nodes": [...],
  "edges": [...],
  "viewport": { "x": 0, "y": 0, "zoom": 1 }
}
```

### Node Object
```json
{
  "id": "unique_id",
  "position": { "x": 100, "y": 50 },
  "type": "agentFlow",  // or "stickyNote", "iteration"
  "data": {
    "id": "node_data_id",
    "label": "Display Label",
    "name": "nodeTypeAgentflow",  // e.g., httpAgentflow, conditionAgentflow
    "version": "1.0",
    "color": "#FFB938",
    "category": "Agent Flows",
    "inputParams": [...],    // UI input fields
    "inputAnchors": [...],   // Connected inputs
    "inputs": {...},         // Input values
    "outputAnchors": [...],  // Output definitions
    "outputs": {}            // Output values
  }
}
```

### Edge Object
```json
{
  "id": "source-sourceHandle-target-targetHandle",
  "source": "source_node_id",
  "target": "target_node_id",
  "sourceHandle": "nodeId-output-name-type",
  "targetHandle": "nodeId-input-name-type",
  "data": {
    "sourceColor": "#FFB938",
    "targetColor": "#64B5F6"
  },
  "type": "agentFlow"
}
```

## Supported Node Types

- `startAgentflow` - Workflow entry point
- `httpAgentflow` - HTTP request node
- `conditionAgentflow` - Conditional branching
- `llmAgentflow` - LLM integration
- `agentAgentflow` - Agent node
- `customFunctionAgentflow` - Custom JavaScript code
- `toolAgentflow` - Tool integration
- `directReplyAgentflow` - Direct message return
- `iterationAgentflow` - Loop/iteration
- `humanInputAgentflow` - Wait for human input
- `stickyNoteAgentflow` - Documentation (non-executable)

## Flowise Configuration

### Running Flowise Locally
```bash
npm install flowise
npx flowise start
```
Default UI: http://localhost:3000

### API Key Setup (Optional)
For Flowise to call protected endpoints, configure API keys in Flowise settings or pass `x-api-key` header in HTTP nodes.

### Database
Flowise uses SQLite by default. For production, configure PostgreSQL or other database in `.env`.

## Troubleshooting

### Import Shows Empty Canvas
- Ensure using Flowise v2+ with agentflow support
- Verify `nodes` and `edges` arrays are valid JSON
- Check node `name` values match `*Agentflow` pattern

### Nodes Not Connecting
- Verify `sourceHandle` and `targetHandle` formats match
- Ensure source and target node IDs exist in nodes array
- Edge `type` should be `"agentFlow"`

### HTTP Requests Fail
- Confirm app is running on `http://localhost:3001`
- Check firewall/CORS if Flowise runs on different port
- Verify API endpoint paths in node configuration

## Authentication & Security

- Flowise runs with API key authentication (configurable)
- App endpoints use role-based access control (Manager roles required)
- SMTP credentials stored in environment variables
- Proxy endpoint validates manager authentication before escalating

## Next Steps

1. **Import** `agentic_flow_v2_native.json` into Flowise UI
2. **Configure** manager authentication in app settings
3. **Test** escalation by triggering manually from Flowise UI
4. **Schedule** workflow using Flowise schedule feature (optional)
5. **Monitor** escalation logs in app dashboard
