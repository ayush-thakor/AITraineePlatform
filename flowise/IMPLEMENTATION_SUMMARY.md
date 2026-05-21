# Flowise V2 Implementation Summary

## Fixed Flow

The working Flowise import is now a five-node Agentflow:

```text
startAgentflow
customFunctionAgentflow
httpAgentflow
customFunctionAgentflow
directReplyAgentflow
```

The old six-node flow was removed because its `conditionAgentflow` configuration
was not valid for Flowise V2 and raised:

```text
conditions is not iterable
```

## Endpoint

The HTTP node posts to:

```text
http://localhost:3005/api/manager/flowise/proxy
```

Body:

```json
{ "deadline": "YYYY-MM-DD" }
```

Auth:

```text
x-api-key: FLOWISE_PROXY_KEY
```

## Verified

The saved Flowise flows `AITraineePortal` and `AITraineePlatform 3005` both ran
through Flowise prediction API successfully with `2026-05-25`.
