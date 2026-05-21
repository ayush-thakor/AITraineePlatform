Flowise agentic flow for AI Trainee Platform

Overview

This folder contains a Flowise import template (`agentic_flow.json`) and documentation for building an agentic Flowise workflow that orchestrates the app's features.

> Note: `agentic_flow.json` is a high-level flow template. Flowise may not render it directly because it uses generic node types. Use the manual build instructions below if the import shows an empty graph.

Goals

- Allow a manager to trigger a deadline-based escalation.
- Parse natural manager instructions (deadline, optional notes).
- Pull trainee and module data from the app.
- Evaluate completions and score updates after the deadline.
- Build and send an escalation email (via the app's `/api/manager/escalation` endpoint).
- Return a concise confirmation and summary to the manager.

Nodes (mapping guidance)

- User Prompt: Flowise `Prompt` or `Input` node where manager gives instruction, e.g. "Escalate trainees not complete by 2026-05-25".

- Parse Deadline: Use an `LLM` or `Prompt` node with a small parsing prompt that extracts an ISO date. Example prompt:

  "Extract a date in YYYY-MM-DD format from the following text. Return JSON {\"deadline\":\"YYYY-MM-DD\"}. If no date found return {\"deadline\": null}.\nText: {{user_input}}"

- Validate Date: Conditional node (Flowise "Switch" / logic node) that asks follow-up if date missing.

- List Trainees: `HTTP` node calling `GET /api/trainees` (or use existing `listTrainees` server helper to create a route if not present). The included template uses `/api/modules` as an example — you may create a dedicated endpoint `/api/manager/trainees` that returns trainees and scores.

- Evaluate Completions & Scores: `LLM` or `Function` node that compares trainee completedModules and scores timestamps with the deadline, producing `overdueTrainees` and `scoresAfterDeadline` JSON arrays.

- Build Escalation Email: `Prompt` node to craft the email subject/body using the results.

- Send Escalation: `HTTP` node POSTing to `/api/manager/flowise/proxy` with `{"deadline":"YYYY-MM-DD"}`. Note: this proxy route accepts an API key via the `x-api-key` header.

- Report Back: Return the response to the manager and optionally store an audit record.

Authentication notes

- `POST /api/manager/escalation` uses `requireApiUser(MANAGER_ROLES)` in the app. For Flowise to call this route automatically you must:
  - Start Flowise on the same machine and use cookie-based session (copy browser session cookie to Flowise HTTP headers), or
  - Add a short-lived API key mechanism to the app (recommended for automation), or
  - Temporarily relax the endpoint auth for local testing.

How to import into Flowise

1. Open Flowise UI.
2. Choose "Import Flow" and upload `flowise/agentic_flow.json`.
3. If the import renders an empty graph, use the manual build instructions in `flowise/agentic_flow_manual_build.md` instead.
4. For each generic node in the import, map as follows:
   - `custom` nodes -> Flowise `LLM` or `Prompt` nodes with the prompt text.
   - `http` nodes -> Flowise `HTTP` request nodes; set method, URL, headers, and body templates.
   - `switch` nodes -> Flowise `Switch` or condition/logic nodes.
   - `input` nodes -> Flowise `Input`/`Prompt` nodes.
   - `output` nodes -> Flowise `Output`/`Response` nodes.
5. Attach an LLM provider in Flowise (OpenAI, local LLM, etc.).
6. Wire authentication for the `send_escalation` node (cookie, bearer token, or temp API key).

Testing locally

- Start the app in dev mode:

```bash
npm run dev
# or for a production build
npm exec -- next build
npm start
```

- The app is currently running on `http://localhost:3005`.

- In Flowise, run the flow and enter a manager instruction like:

"Escalate trainees who haven't completed by 2026-05-25"

- Confirm Flowise calls `http://localhost:3005/api/manager/flowise/proxy` and the app logs/sends the email.

Optional enhancements

- Add a `/api/manager/trainees` endpoint that returns structured trainee data optimized for the flow.
- Add an `agent` node that can autonomously schedule recurring escalations (cron-style) by integrating with a scheduler service or the operating system.
- Add audit logging inside the app for agent-sent escalation emails.

Environment variables needed for Flowise integration:

```env
FLOWISE_PROXY_KEY=your-secret-key
ESCALATION_EMAIL_RECIPIENT=ayushthakor1313@gmail.com
```

Flowise HTTP allowlist (to permit calling localhost)

If Flowise shows "Access to this host is denied by policy." you must set the target host(s) in Flowise's allowlist before starting Flowise. The environment variables MUST be set in the same process that launches Flowise. Example:

```bash
# Bash
export HTTP_ALLOW_LIST=localhost,127.0.0.1,localhost:3005
export FLOWISE_PROXY_KEY=your-secret-key
npx flowise start
```

```powershell
# PowerShell
$env:HTTP_ALLOW_LIST='localhost,127.0.0.1,localhost:3005'
$env:FLOWISE_PROXY_KEY='your-secret-key'
npx flowise start
```

If you already have the `flowise/scripts` helper scripts, you can start Flowise and import the flow with the correct envs in one command:

```powershell
.lowise\scripts\start_flowise_and_import.ps1 -FlowJsonPath '.\flowise\agentic_flow_v2_native_docker.json'
```

```bash
./flowise/scripts/start_flowise_and_import.sh ./flowise/agentic_flow_v2_native_docker.json
```

Once Flowise is running, import the flow or use the helper script to import it automatically.

- Docker: containers treat `localhost` as the container itself. Use `host.docker.internal` in your Flowise HTTP node URLs, or run Flowise with `--network=host` (Linux) so `localhost` refers to the host. Example options:

1) Change the HTTP node URLs to `http://host.docker.internal:3005/...` (a Docker-friendly flow copy is provided as `agentic_flow_v2_native_docker.json`).

2) Run Flowise Docker with host networking (Linux):

```bash
docker run --network=host -e HTTP_ALLOW_LIST=localhost,127.0.0.1 -e FLOWISE_PROXY_KEY=your-secret-key flowise/flowise
```

3) Or set `HTTP_ALLOW_LIST` inside the container environment and ensure the host is reachable from the container.

If Flowise is remote (not on the same machine), expose your app endpoint (ngrok/tunnel) and add the public host to the allowlist instead.

Security note: prefer using environment variables for `FLOWISE_PROXY_KEY` instead of embedding secrets in Flowise JSON files.

Optional SMTP variables for real email delivery:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your-smtp-pass
SMTP_SECURE=false
MAIL_FROM=you@example.com
SMTP_TLS_REJECT_UNAUTHORIZED=true
```

If local SMTP fails with `self-signed certificate in certificate chain`, prefer fixing the trusted certificate chain. For local testing only, set `SMTP_TLS_REJECT_UNAUTHORIZED=false` and restart the app.

If you want, I can:
- Generate a fully-valid Flowise JSON matching the exact Flowise schema (I will need to know your Flowise version), or
- Add a helper endpoint `/api/manager/flowise/proxy` that accepts an API key and runs the escalation so Flowise can call a single-key-protected route.
