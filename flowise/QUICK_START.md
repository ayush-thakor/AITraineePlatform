# 🚀 Quick Start: Flowise Escalation Workflow

## 30-Second Setup

### Step 1: Run Flowise (if not already running)
```bash
cd path/to/Flowise
npm install
npx flowise start
```
Then open http://localhost:3000

### Step 2: Import the Flow
1. Click **Agentflows** in sidebar
2. Click **Add New**
3. Paste the JSON from `agentic_flow_v2_native.json` into the import dialog
   - **OR** upload the file directly
4. ✅ Flow appears with 6 connected nodes

### Step 3: Verify Configuration
- **Node 2**: "Fetch Trainees Data" → URL should be `http://localhost:3001/api/manager/trainees`
- **Node 5**: "Send Escalation" → URL should be `http://localhost:3001/api/manager/flowise/proxy`
- Both should have `Method: POST` or `GET` as shown

### Step 4: Test
1. Click **Test** in Flowise UI
2. Watch nodes execute in order
3. Check app logs for escalation email sent

## What This Flow Does

```
Start Trigger
    ↓
Fetch incomplete trainees from API
    ↓
Check if any are incomplete
    ├─ Yes → Prepare data → Send escalation email
    └─ No → Return "all complete" message
```

## App Integration

Your app provides:
- **GET /api/manager/trainees** → Returns trainee data
- **POST /api/manager/flowise/proxy** → Receives escalation, sends email

Make sure both endpoints exist and your SMTP is configured in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

If Flowise blocks local HTTP calls, also set:
```env
HTTP_ALLOW_LIST=localhost,127.0.0.1
```

## Node-by-Node Breakdown

| # | Node | Input | Output | Action |
|---|------|-------|--------|--------|
| 1 | Escalation Trigger | Start | Trigger signal | Workflow entry |
| 2 | Fetch Trainees | Trigger signal | Trainee JSON | GET /api/manager/trainees |
| 3 | Check Incomplete | Trainee JSON | True/False | if (incomplete.length > 0) |
| 4 | Prepare Data | Trainee JSON | Formatted payload | Custom JS transform |
| 5 | Send Escalation | Payload | Response | POST /api/manager/flowise/proxy |
| 6 | No Action | (from node 3 false) | Completion msg | Return when all done |

## Troubleshooting

**Q: Import shows blank canvas**
A: Ensure `agentic_flow_v2_native.json` is valid JSON (use VS Code or online validator)

**Q: Nodes exist but no connections**
A: Click each node → verify `inputAnchors` and `outputAnchors` have matching handles on connected nodes

**Q: HTTP nodes show errors**
A: Confirm your app is running at `http://localhost:3001` and endpoints exist. If Flowise blocks local calls, add `HTTP_ALLOW_LIST=localhost,127.0.0.1` to Flowise environment.

**Q: SMTP not sending**
A: Check env vars in app `.env` and Flowise console logs

## Next: Custom Modifications

To customize the flow:
1. Modify node inputs in Flowise UI (double-click node)
2. Add/remove conditions
3. Change HTTP endpoints
4. Save flow and export as backup JSON

See `IMPLEMENTATION_SUMMARY.md` for detailed schema reference.

---

**Ready?** Import `agentic_flow_v2_native.json` now and test! 🎉
