# Manual Flowise Build for Manager Escalation Flow

This file explains how to create the manager escalation flow manually in Flowise if `flowise/agentic_flow.json` imports but renders an empty canvas.

## Why this is needed

The current JSON is a high-level template and uses generic node type names like `input`, `custom`, `http`, `switch`, and `output`.
Flowise import may accept the JSON but still fail to render because it expects native Flowise node schemas.

## Manual flow structure

### 1. Manager instruction input
- Node type: `Input` or `Prompt`
- Title: `Manager Instruction`
- Placeholder: `Example: Escalate trainees who haven't completed by 2026-05-25`
- Output variable: `user_input`

### 2. Parse deadline
- Node type: `Prompt` / `LLM`
- Name: `Parse Deadline`
- Prompt:
  ```text
  Extract an ISO date in YYYY-MM-DD format from the manager instruction.
  Return JSON:
  {"deadline":"YYYY-MM-DD" | null, "notes":"..."}
  If no date is found, set deadline to null.

  Text: {{user_input}}
  ```
- Set output variable to `parsed`

### 3. Deadline present check
- Node type: `Switch`, `Condition`, or `Boolean` node
- Expression: `parsed.deadline != null`
- Output values: `true` and `false`

### 4. Ask for date fallback
- Node type: `Input` or `Prompt`
- Name: `Ask For Deadline`
- Placeholder: `Enter deadline (YYYY-MM-DD)`
- Output variable: `user_deadline`

### 5. Fetch trainee progress
- Node type: `HTTP Request`
- Name: `List Trainees`
- Method: `GET`
- URL: `http://localhost:3005/api/manager/trainees`
- Headers:
  - `x-api-key: {{FLOWISE_PROXY_KEY}}`
- Output variable: `trainees`

### 6. Evaluate overdue trainees and scores
- Node type: `Prompt` / `LLM`
- Name: `Evaluate Overdue & Scores`
- Prompt:
  ```text
  Given a deadline and a list of trainees, identify trainees not completed by the deadline and any scores submitted after the deadline.
  Return JSON:
  {"overdueTrainees": [...], "scoresAfterDeadline": [...]}

  Deadline: {{#if parsed.deadline}}"{{parsed.deadline}}"{{else}}"{{user_deadline}}"{{/if}}
  Trainees: {{trainees}}
  ```
- Set output variable to `evaluation`

### 7. Build escalation email
- Node type: `Prompt` / `LLM`
- Name: `Build Escalation Email`
- Prompt:
  ```text
  Compose a concise escalation email to the manager's manager with subject and body.
  Use the lists of overdue trainees and scores after the deadline.
  Return JSON: {"subject": "...", "body": "..."}

  Deadline: {{#if parsed.deadline}}"{{parsed.deadline}}"{{else}}"{{user_deadline}}"{{/if}}
  Parsed notes: {{parsed.notes}}
  Evaluation: {{evaluation}}
  ```
- Set output variable to `email`

### 8. Send escalation to app proxy
- Node type: `HTTP Request`
- Name: `Send Escalation (POST)`
- Method: `POST`
- URL: `http://localhost:3005/api/manager/flowise/proxy`
- Headers:
  - `Content-Type: application/json`
  - `x-api-key: {{FLOWISE_PROXY_KEY}}`
- Body (JSON):
  ```json
  {
    "deadline": "{{#if parsed.deadline}}{{parsed.deadline}}{{else}}{{user_deadline}}{{/if}}",
    "subject": "{{email.subject}}",
    "body": "{{email.body}}",
    "notes": "{{parsed.notes}}"
  }
  ```
- Output variable: `send_response`

### 9. Final report
- Node type: `Output` or `Response`
- Name: `Report Back`
- Template:
  ```text
  Escalation sent. Summary:
  Overdue trainees: {{evaluation.overdueTrainees.length}}
  Scores after deadline: {{evaluation.scoresAfterDeadline.length}}
  API response: {{send_response}}
  ```

## Connections

1. `Manager Instruction` -> `Parse Deadline`
2. `Parse Deadline` -> `Deadline Present?`
3. `Deadline Present?` (`true`) -> `List Trainees`
4. `Deadline Present?` (`false`) -> `Ask For Deadline`
5. `Ask For Deadline` -> `List Trainees`
6. `List Trainees` -> `Evaluate Overdue & Scores`
7. `Evaluate Overdue & Scores` -> `Build Escalation Email`
8. `Build Escalation Email` -> `Send Escalation (POST)`
9. `Send Escalation (POST)` -> `Report Back`

## Auth setup

- Set Flowise environment variable `FLOWISE_PROXY_KEY`.
- The app route `/api/manager/flowise/proxy` accepts `x-api-key` and forwards the escalation request safely.
- If you need full manager auth instead, use Flowise request headers to forward session cookies or bearer tokens.

## When to use manual build

Use this manual build when the imported file appears blank or if Flowise cannot map generic node types automatically.

If you want, I can also help convert the template into a Flowise-specific export once you tell me the exact Flowise version or the current node type names available in your Flowise instance.