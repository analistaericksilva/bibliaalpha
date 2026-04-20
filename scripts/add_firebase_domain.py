import json, os, sys, subprocess, requests
import google.oauth2.service_account as sa
import google.auth.transport.requests

sa_json = os.environ.get('SA_JSON', '')
creds_info = json.loads(sa_json)
creds = sa.Credentials.from_service_account_info(
    creds_info,
    scopes=['https://www.googleapis.com/auth/cloud-platform',
            'https://www.googleapis.com/auth/firebase']
)
auth_req = google.auth.transport.requests.Request()
creds.refresh(auth_req)
token = creds.token

site = 'sentinela-ai-489015'
domain = 'bibliaalpha.org'

# v1beta1 LIST domains existentes
base = f'https://firebasehosting.googleapis.com/v1beta1/sites/{site}/domains'
hdrs = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

print('=== Dominios existentes no Firebase Hosting ===')
r = requests.get(base, headers=hdrs)
print(f'LIST: HTTP {r.status_code}')
if r.status_code == 200:
    data = r.json()
    for d_item in data.get('domains', []):
        print(f'  {d_item.get("domainName")} -> status={d_item.get("status")}')
    if not data.get('domains'):
        print('  (nenhum dominio customizado)')
else:
    print(r.text[:300])

# Tentar adicionar sem campo site
print('\n=== Tentando POST sem campo site ===')
r2 = requests.post(base, headers=hdrs, json={'domainName': domain})
print(f'POST: HTTP {r2.status_code}')
print(r2.text[:600])

# GET status
print('\n=== GET status apos POST ===')
r3 = requests.get(f'{base}/{domain}', headers=hdrs)
print(f'GET: HTTP {r3.status_code}')
print(r3.text[:800])
