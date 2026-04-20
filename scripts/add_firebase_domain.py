import json, sys, os, requests
import google.auth, google.auth.transport.requests
from google.oauth2 import service_account

SA_JSON = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS_JSON', '')
if not SA_JSON:
    print("ERRO: GOOGLE_APPLICATION_CREDENTIALS_JSON nao definido")
    sys.exit(1)

with open('/tmp/sa.json', 'w') as f:
    f.write(SA_JSON)

sa_info = json.loads(SA_JSON)
project_id = sa_info.get('project_id', 'sentinela-ai-489015')

credentials = service_account.Credentials.from_service_account_file(
    '/tmp/sa.json',
    scopes=['https://www.googleapis.com/auth/firebase']
)
auth_req = google.auth.transport.requests.Request()
credentials.refresh(auth_req)
token = credentials.token

headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

CUSTOM_DOMAIN = 'bibliaalpha.studiologos.com.br'
SITE_ID = 'sentinela-ai-489015'

print(f"Projeto: {project_id}")
print(f"Site ID: {SITE_ID}")
print(f"Dominio a adicionar: {CUSTOM_DOMAIN}")
print()

sites_url = f'https://firebasehosting.googleapis.com/v1beta1/projects/{project_id}/sites'
r = requests.get(sites_url, headers=headers)
print(f"Sites existentes ({r.status_code}):")
for s in r.json().get('sites', []):
    print(f"  - {s.get('name')} | url: {s.get('defaultUrl')}")

domains_url = f'https://firebasehosting.googleapis.com/v1beta1/sites/{SITE_ID}/domains'
r = requests.get(domains_url, headers=headers)
print(f"\nDominios atuais ({r.status_code}):")
for d in r.json().get('domains', []):
    print(f"  - {d.get('domainName')} | status: {d.get('status')}")

body = {'domainName': CUSTOM_DOMAIN}
r = requests.post(domains_url, headers=headers, json=body)
print(f"\nAdicionar {CUSTOM_DOMAIN}: {r.status_code}")
resp_data = r.json()
print(json.dumps(resp_data, indent=2))

if r.status_code == 409:
    print("\nDominio ja existe — buscando detalhes...")
    r2 = requests.get(f"{domains_url}/{CUSTOM_DOMAIN}", headers=headers)
    if r2.status_code == 200:
        resp_data = r2.json()
        print(json.dumps(resp_data, indent=2))

provision = resp_data.get('provisioning', {})
dns_records = provision.get('dnsRecords', []) or provision.get('expectedDnsRecords', [])
print("\n" + "="*60)
print("REGISTROS DNS NECESSARIOS NA HOSTINGER:")
print("="*60)
if dns_records:
    for rec in dns_records:
        print(f"  Tipo: {rec.get('type')}")
        print(f"  Host: {rec.get('domainName', CUSTOM_DOMAIN)}")
        print(f"  Valor: {rec.get('rdata', rec.get('value', ''))}")
        print()
else:
    print(f"  Adicione CNAME: bibliaalpha -> sentinela-ai-489015.web.app")
    print(f"  (registros de verificacao apareceram apos dominio ser processado)")
print("="*60)
print(f"Status: {resp_data.get('status', 'PROCESSING')}")
