#!/usr/bin/env python3
"""Deploy Firestore Security Rules via REST API."""
import json
import sys
import os
import requests
import google.auth.transport.requests
from google.oauth2 import service_account

SA_FILE = "/tmp/sa.json"
PROJECT_ID = "sentinela-ai-489015"
DB_ID = "ai-studio-d00d75cd-ea9b-4bf1-9db1-7ac14eff586f"
RULES_FILE = "firestore.rules"

with open(SA_FILE) as f:
    sa = json.load(f)

creds = service_account.Credentials.from_service_account_info(
    sa,
    scopes=[
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/firebase",
    ],
)
creds.refresh(google.auth.transport.requests.Request())
token = creds.token

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
}

with open(RULES_FILE) as f:
    rules = f.read()

# 1. Create ruleset
r = requests.post(
    f"https://firebaserules.googleapis.com/v1/projects/{PROJECT_ID}/rulesets",
    json={"source": {"files": [{"content": rules, "name": "firestore.rules"}]}},
    headers=headers,
)
print(f"Create ruleset: {r.status_code}")
if not r.ok:
    print(r.text)
    sys.exit(1)

ruleset_name = r.json()["name"]
print(f"Ruleset: {ruleset_name}")

# 2. Update release
release_name = f"projects/{PROJECT_ID}/releases/cloud.firestore/{DB_ID}"
payload = {"release": {"name": release_name, "rulesetName": ruleset_name}}

r2 = requests.patch(
    f"https://firebaserules.googleapis.com/v1/{release_name}",
    json=payload,
    headers=headers,
    params={"updateMask": "rulesetName"},
)
print(f"Patch release: {r2.status_code}")
if r2.status_code == 404:
    r2 = requests.post(
        f"https://firebaserules.googleapis.com/v1/projects/{PROJECT_ID}/releases",
        json=payload,
        headers=headers,
    )
    print(f"Create release: {r2.status_code}")
if not r2.ok:
    print(r2.text)
    sys.exit(1)

print("Firestore rules deployed successfully!")
