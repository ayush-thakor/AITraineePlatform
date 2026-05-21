# Quick Start: Flowise Escalation Workflow

## App

The app should run at:

```text
http://localhost:3005
```

To restart it:

```bash
npm run dev:3005
```

## Flowise

Flowise should run at:

```text
http://localhost:3000
```

For local testing, start Flowise with:

```powershell
$env:FLOWISE_PROXY_KEY='8b7f6c9f2d4e1a3b5c7d0e8f9a1b2c3d'
$env:HTTP_SECURITY_CHECK='false'
$env:HTTP_ALLOW_LIST='localhost,127.0.0.1,localhost:3005'
npx flowise start
```

## Import

Import:

```text
flowise/agentic_flow_v2_native.json
```

This flow has five nodes:

```text
Start Escalation -> Normalize Deadline -> Send Escalation -> Format Summary -> Manager Reply
```

It does not use `conditionAgentflow`.

## Test

Run the Agentflow with:

```text
2026-05-25
```
