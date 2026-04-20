#!/usr/bin/env python3
import json, sys, time
import google.auth.transport.requests
from google.oauth2 import service_account
import requests

PROJECT_ID = "sentinela-ai-489015"
DB_ID = "ai-studio-d00d75cd-ea9b-4bf1-9db1-7ac14eff586f"
SA_FILE = "/tmp/sa.json"

with open(SA_FILE) as f:
    sa = json.load(f)

creds = service_account.Credentials.from_service_account_info(
    sa,
    scopes=[
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/firebase",
        "https://www.googleapis.com/auth/datastore",
    ],
)
creds.refresh(google.auth.transport.requests.Request())
token = creds.token
hdrs = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# ── 1. Deploy Firestore Rules ──────────────────────────────
with open("firestore.rules") as f:
    rules = f.read()

r = requests.post(
    f"https://firebaserules.googleapis.com/v1/projects/{PROJECT_ID}/rulesets",
    json={"source": {"files": [{"content": rules, "name": "firestore.rules"}]}},
    headers=hdrs,
)
print(f"Create ruleset: {r.status_code}")
if not r.ok:
    print(r.text); sys.exit(1)
ruleset_name = r.json()["name"]
print(f"Ruleset: {ruleset_name}")

release_name = f"projects/{PROJECT_ID}/releases/cloud.firestore/{DB_ID}"
payload = {"release": {"name": release_name, "rulesetName": ruleset_name}}
r2 = requests.patch(
    f"https://firebaserules.googleapis.com/v1/{release_name}",
    json=payload, headers=hdrs, params={"updateMask": "rulesetName"},
)
print(f"Patch release: {r2.status_code}")
if r2.status_code == 404:
    r2 = requests.post(
        f"https://firebaserules.googleapis.com/v1/projects/{PROJECT_ID}/releases",
        json=payload, headers=hdrs,
    )
    print(f"Create release: {r2.status_code}")
if not r2.ok:
    print(r2.text); sys.exit(1)
print("Firestore Rules OK")

# ── 2. Corrigir documento do superadmin ───────────────────
r3 = requests.post(
    f"https://identitytoolkit.googleapis.com/v1/projects/{PROJECT_ID}/accounts:lookup",
    json={"email": ["analista.ericksilva@gmail.com"]},
    headers=hdrs,
)
print(f"User lookup: {r3.status_code}")

if r3.ok and r3.json().get("users"):
    uid = r3.json()["users"][0]["localId"]
    print(f"UID: {uid}")
    doc_url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/{DB_ID}/documents/users/{uid}"
    r4 = requests.get(doc_url, headers=hdrs)
    print(f"Get doc: {r4.status_code}")
    now_ms = str(int(time.time() * 1000))
    update_fields = {
        "fields": {
            "email": {"stringValue": "analista.ericksilva@gmail.com"},
            "displayName": {"stringValue": "Erick Silva"},
            "role": {"stringValue": "admin"},
            "status": {"stringValue": "approved"},
            "updatedAt": {"integerValue": now_ms},
        }
    }
    if r4.status_code == 404:
        update_fields["fields"]["createdAt"] = {"integerValue": now_ms}
        r5 = requests.patch(doc_url, json=update_fields, headers=hdrs)
    else:
        r5 = requests.patch(
            doc_url, json=update_fields, headers=hdrs,
            params={"updateMask.fieldPaths": ["status", "role", "updatedAt"]},
        )
    print(f"Upsert doc: {r5.status_code}")
    if not r5.ok:
        print(r5.text)
else:
    print("ERRO: usuario nao encontrado")
    print(r3.text); sys.exit(1)

print("CONCLUIDO COM SUCESSO")
