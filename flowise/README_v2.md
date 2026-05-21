# Flowise Agentflow V2 for AI Trainee Platform

Use `agentic_flow_v2_native.json` for local Flowise. Use
`agentic_flow_v2_native_docker.json` only when Flowise runs in Docker.

## Current Flow

```text
Start Escalation
  -> Normalize Deadline
  -> Send Escalation POST /api/manager/flowise/proxy
  -> Format Summary
  -> Manager Reply
```

There is intentionally no `conditionAgentflow` node. The app already owns trainee
lookup, overdue detection, score checks, and email generation. Flowise only
collects a deadline, calls the app proxy, and reports the result.

## Local Setup

1. Run the app at `http://localhost:3005`.
2. Run Flowise at `http://localhost:3000`.
3. Set or create the Flowise variable `FLOWISE_PROXY_KEY`.
4. Import `flowise/agentic_flow_v2_native.json`.
5. Test with a date such as `2026-05-25`.

For local development, start Flowise with:

```env
HTTP_SECURITY_CHECK=false
HTTP_ALLOW_LIST=localhost,127.0.0.1,localhost:3005
```

## Docker Setup

Import `agentic_flow_v2_native_docker.json`. It calls:

```text
http://host.docker.internal:3005/api/manager/flowise/proxy
```

Use:

```env
HTTP_SECURITY_CHECK=false
HTTP_ALLOW_LIST=localhost,127.0.0.1,host.docker.internal,host.docker.internal:3005
```

## Important

Leave the HTTP node's `HTTP Credential` field empty. Authentication is handled by
the explicit `x-api-key` header using `FLOWISE_PROXY_KEY`.
