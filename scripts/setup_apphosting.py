import json, requests, time
import google.auth.transport.requests
from google.oauth2 import service_account

with open("/tmp/sa.json") as f:
    sa = json.load(f)

creds = service_account.Credentials.from_service_account_info(
    sa, scopes=["https://www.googleapis.com/auth/cloud-platform"])
creds.refresh(google.auth.transport.requests.Request())
token = creds.token
project_id = "sentinela-ai-489015"
hdrs = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("=== Enabling Firebase App Hosting API ===")
r = requests.post(
    f"https://serviceusage.googleapis.com/v1/projects/{project_id}/services/firebaseapphosting.googleapis.com:enable",
    headers=hdrs, json={})
print("Enable API:", r.status_code, r.text[:500])

time.sleep(15)
creds.refresh(google.auth.transport.requests.Request())
hdrs["Authorization"] = f"Bearer {creds.token}"

print("\n=== Granting IAM role ===")
sa_email = sa["client_email"]
r2 = requests.post(
    f"https://cloudresourcemanager.googleapis.com/v1/projects/{project_id}:getIamPolicy",
    headers=hdrs, json={})
policy = r2.json()
bindings = policy.get("bindings", [])
role = "roles/firebaseapphosting.admin"
member = f"serviceAccount:{sa_email}"
existing = next((b for b in bindings if b["role"] == role), None)
if existing:
    if member not in existing["members"]:
        existing["members"].append(member)
else:
    bindings.append({"role": role, "members": [member]})
policy["bindings"] = bindings
r3 = requests.post(
    f"https://cloudresourcemanager.googleapis.com/v1/projects/{project_id}:setIamPolicy",
    headers=hdrs, json={"policy": policy})
print("Set IAM:", r3.status_code, r3.text[:300])

time.sleep(5)
creds.refresh(google.auth.transport.requests.Request())
hdrs["Authorization"] = f"Bearer {creds.token}"

print("\n=== List App Hosting backends ===")
r4 = requests.get(
    f"https://firebaseapphosting.googleapis.com/v1beta/projects/{project_id}/locations/-/backends",
    headers=hdrs)
print("STATUS:", r4.status_code)
print("BODY:", r4.text[:3000])
