#!/usr/bin/env python3
"""Deploya Firestore Rules e corrige documento do superadmin com campos corretos."""
import json, sys, time
import google.auth.transport.requests
from google.oauth2 import service_account
import requests

PROJECT_ID = "sentinela-ai-489015"
DB_ID      = "ai-studio-d00d75cd-ea9b-4bf1-9db1-7ac14eff586f"
SA_FILE    = "/tmp/sa.json"
ADMIN_EMAIL = "analista.ericksilva@gmail.com"

with open(SA_FILE) as f:
    sa = json.load(f)

creds = service_account.Credentials.from_service_account_info(
    sa,
    scopes=["https://www.googleapis.com/auth/cloud-platform",
            "https://www.googleapis.com/auth/firebase",
            "https://www.googleapis.com/auth/datastore"],
)
creds.refresh(google.auth.transport.requests.Request())
token = creds.token
H = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# ── 1. Deploy Firestore Rules ─────────────────────────────
with open("firestore.rules") as f:
    rules = f.read()

r = requests.post(
    f"https://firebaserules.googleapis.com/v1/projects/{PROJECT_ID}/rulesets",
    json={"source": {"files": [{"content": rules, "name": "firestore.rules"}]}},
    headers=H,
)
print(f"Create ruleset: {r.status_code}")
if not r.ok:
    print(r.text); sys.exit(1)
ruleset_name = r.json()["name"]

release_name = f"projects/{PROJECT_ID}/releases/cloud.firestore/{DB_ID}"
payload = {"release": {"name": release_name, "rulesetName": ruleset_name}}
r2 = requests.patch(
    f"https://firebaserules.googleapis.com/v1/{release_name}",
    json=payload, headers=H, params={"updateMask": "rulesetName"},
)
if r2.status_code == 404:
    r2 = requests.post(
        f"https://firebaserules.googleapis.com/v1/projects/{PROJECT_ID}/releases",
        json=payload, headers=H,
    )
print(f"Release: {r2.status_code}")
if not r2.ok:
    print(r2.text); sys.exit(1)
print("Firestore Rules OK")

# ── 2. Buscar UID do superadmin ───────────────────────────
r3 = requests.post(
    f"https://identitytoolkit.googleapis.com/v1/projects/{PROJECT_ID}/accounts:lookup",
    json={"email": [ADMIN_EMAIL]},
    headers=H,
)
print(f"User lookup: {r3.status_code}")
if not r3.ok or not r3.json().get("users"):
    print("Usuario nao encontrado — sera criado no primeiro login")
    print("DONE")
    sys.exit(0)

uid  = r3.json()["users"][0]["localId"]
photo = r3.json()["users"][0].get("photoUrl", "")
name  = r3.json()["users"][0].get("displayName", "Erick Silva")
print(f"UID: {uid} | nome: {name}")

# ── 3. Gravar documento com campos CORRETOS ───────────────
doc_url = (
    f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}"
    f"/databases/{DB_ID}/documents/users/{uid}"
)
now_ms = str(int(time.time() * 1000))

correct_doc = {
    "fields": {
        "email":     {"stringValue": ADMIN_EMAIL},
        "nome":      {"stringValue": name},
        "foto":      {"stringValue": photo[:1500] if photo else ""},
        "status":    {"stringValue": "approved"},
        "isAdmin":   {"booleanValue": True},
        "updatedAt": {"integerValue": now_ms},
        "createdAt": {"integerValue": now_ms},
    }
}

r4 = requests.patch(doc_url, json=correct_doc, headers=H)
print(f"Upsert documento: {r4.status_code}")
if not r4.ok:
    print(r4.text); sys.exit(1)

print(f"Documento salvo: email={ADMIN_EMAIL}, status=approved, isAdmin=True, nome={name}")
print("DONE")
