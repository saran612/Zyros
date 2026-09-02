#!/usr/bin/env python3
"""
Zyros Integration Test Suite
Validates backend REST endpoints, hardware diagnostics, and session workflows.
"""

import urllib.request
import urllib.error
import json
import sys

BACKEND_URL = "http://localhost:8008"

def test_health_endpoint():
    print("Testing GET /health ...", end=" ")
    try:
        req = urllib.request.urlopen(f"{BACKEND_URL}/health", timeout=5)
        assert req.getcode() == 200, f"Expected 200, got {req.getcode()}"
        body = req.read().decode('utf-8')
        assert body == "OK", f"Expected 'OK', got '{body}'"
        print("✅ PASS")
    except Exception as e:
        print(f"❌ FAIL ({e})")
        sys.exit(1)

def test_onboard_status():
    print("Testing GET /onboard/status ...", end=" ")
    try:
        req = urllib.request.urlopen(f"{BACKEND_URL}/onboard/status", timeout=5)
        assert req.getcode() == 200, f"Expected 200, got {req.getcode()}"
        data = json.loads(req.read().decode('utf-8'))
        assert "onboarded" in data, "Missing 'onboarded' field"
        assert "system_specs" in data, "Missing 'system_specs' field"
        if data["system_specs"]:
            assert "cpu" in data["system_specs"], "Missing 'cpu' in system specs"
            assert "ram" in data["system_specs"], "Missing 'ram' in system specs"
        print("✅ PASS")
    except Exception as e:
        print(f"❌ FAIL ({e})")
        sys.exit(1)

def test_chat_sessions():
    print("Testing GET /chat/sessions ...", end=" ")
    try:
        req = urllib.request.urlopen(f"{BACKEND_URL}/chat/sessions", timeout=5)
        assert req.getcode() == 200, f"Expected 200, got {req.getcode()}"
        sessions = json.loads(req.read().decode('utf-8'))
        assert isinstance(sessions, list), "Expected list of sessions"
        print("✅ PASS")
    except Exception as e:
        print(f"❌ FAIL ({e})")
        sys.exit(1)

def test_specs_handler():
    print("Testing GET /onboard/specs ...", end=" ")
    try:
        req = urllib.request.urlopen(f"{BACKEND_URL}/onboard/specs", timeout=5)
        assert req.getcode() == 200, f"Expected 200, got {req.getcode()}"
        specs = json.loads(req.read().decode('utf-8'))
        assert "cpu" in specs, "Missing cpu spec"
        assert "ram" in specs, "Missing ram spec"
        print("✅ PASS")
    except Exception as e:
        print(f"❌ FAIL ({e})")
        sys.exit(1)

def main():
    print("=" * 50)
    print("🧪 Running Zyros Integration Tests")
    print(f"Target Backend: {BACKEND_URL}")
    print("=" * 50)
    
    test_health_endpoint()
    test_onboard_status()
    test_chat_sessions()
    test_specs_handler()

    print("=" * 50)
    print("🎉 All Integration Tests Passed Successfully!")
    print("=" * 50)

if __name__ == "__main__":
    main()
