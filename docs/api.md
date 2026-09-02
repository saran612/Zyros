# API Reference

Zyros backend exposes a REST and SSE (Server-Sent Events) API on `http://localhost:8008`.

---

## 🟢 Health & Status

### `GET /health`
Returns `OK` when the backend server is operational.

**Response**:
```text
OK
```

---

## 🖥️ System & Onboarding

### `GET /onboard/status`
Returns the current workstation onboarding status, user info, hardware specs, and model recommendations.

**Response**:
```json
{
  "onboarded": true,
  "username": "saran",
  "system_specs": {
    "cpu": {
      "model_name": "Intel(R) Core(TM) i7-10610U CPU @ 1.80GHz",
      "physical_cores": 4,
      "logical_cores": 8
    },
    "ram": {
      "total_gb": 30.97,
      "free_gb": 15.79
    },
    "disk": {
      "total_gb": 491.08,
      "available_gb": 59.01
    },
    "gpus": [
      {
        "name": "Graphics Controller",
        "vendor": "Intel Corporation"
      }
    ],
    "os": {
      "distro": "Arch Linux",
      "kernel": "7.1.8-arch1-3"
    }
  },
  "suggestions": [
    {
      "name": "Qwen 2.5 14B (Q4_K_M)",
      "size": "Heavy (~9.0GB VRAM/RAM)",
      "description": "Excellent intermediate option offering complex multi-step reasoning.",
      "gpu_accel": "Supported (Intel Corporation)"
    }
  ],
  "api_key": null,
  "active_model": "Qwen 2.5 1.5B (Q4_K_M)"
}
```

### `POST /onboard/submit`
Initializes onboarding and performs a full system hardware scan.

---

### `POST /onboard/api-key`
Saves and verifies cloud API credentials.

**Request Body**:
```json
{
  "provider": "openai",
  "key": "sk-..."
}
```

---

### `GET /onboard/run-model-stream`
SSE endpoint for streaming local model download progress and Ollama configuration logs.

**Query Parameters**:
- `model`: Name of the model to download (e.g. `llama3.2:3b`).

**Event Stream**:
```json
data: {"status": "downloading", "percentage": 45, "message": "Pulling manifest..."}
```

---

## 💬 Chat & Sessions

### `GET /chat/sessions`
Returns all existing chat conversations.

**Response**:
```json
[
  {
    "id": "sess_1725381200",
    "title": "Hardware Scan and Setup",
    "created_at": "2026-09-03 23:00:00"
  }
]
```

### `GET /chat/sessions/{session_id}`
Returns all messages for a specific session ID.

### `POST /chat/sessions/{session_id}/messages`
Sends a prompt message to the active model and receives assistant completion.

**Request Body**:
```json
{
  "text": "What are my current system specifications?"
}
```
