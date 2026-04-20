import json, os, sys, requests
import google.oauth2.service_account as sa
import google.auth.transport.requests

sa_json = os.environ.get('SA_JSON', '')
if not sa_json:
    print('ERRO: SA_JSON nao definido')
    sys.exit(1)

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
base = f'https://firebasehosting.googleapis.com/v1beta1/sites/{site}/domains'
hdrs = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

r = requests.get(f'{base}/{domain}', headers=hdrs)
print(f'GET {domain}: HTTP {r.status_code}')

if r.status_code != 200:
    r2 = requests.post(base, headers=hdrs, json={'domainName': domain})
    print(f'POST criar: HTTP {r2.status_code}')
    print(r2.text[:500])

r3 = requests.get(f'{base}/{domain}', headers=hdrs)
print(f'Status final: HTTP {r3.status_code}')
if r3.status_code == 200:
    info = r3.json()
    print(f'domainStatus: {info.get("status")}')
    prov = info.get('provisioning', {})
    print()
    print('=== REGISTROS DNS NECESSARIOS ===')
    for rset in prov.get('expectedDnsRecordSets', []):
        print(f'domainName: {rset.get("domainName")}')
        for rec in rset.get('records', []):
            print(f'  TYPE={rec.get("type")}  NAME={rec.get("name","@")}  DATA={rec.get("data","")}')
    if not prov.get('expectedDnsRecordSets'):
        print('(sem expectedDnsRecordSets)')
        print(json.dumps(info, indent=2))
