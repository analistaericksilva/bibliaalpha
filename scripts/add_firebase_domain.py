import json, os, requests
import google.oauth2.service_account as sa
import google.auth.transport.requests

creds_info = json.loads(os.environ['SA_JSON'])
creds = sa.Credentials.from_service_account_info(
    creds_info,
    scopes=['https://www.googleapis.com/auth/cloud-platform',
            'https://www.googleapis.com/auth/firebase']
)
auth_req = google.auth.transport.requests.Request()
creds.refresh(auth_req)
token = creds.token

site = 'sentinela-ai-489015'
old_domain = 'bibliaalpha.studiologos.com.br'
new_domain = 'bibliaalpha.org'
base = f'https://firebasehosting.googleapis.com/v1beta1/sites/{site}/domains'
hdrs = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# 1. DELETE domínio antigo
print(f'=== DELETE {old_domain} ===')
r1 = requests.delete(f'{base}/{old_domain}', headers=hdrs)
print(f'HTTP {r1.status_code}')
print(r1.text[:200] if r1.text else '(empty — OK)')

# 2. POST novo domínio (mesmo formato do existente)
print(f'\n=== POST {new_domain} ===')
body = {'domainName': new_domain, 'site': site}
r2 = requests.post(base, headers=hdrs, json=body)
print(f'HTTP {r2.status_code}')
print(json.dumps(r2.json(), indent=2)[:800])

# 3. GET status novo domínio
print(f'\n=== GET status {new_domain} ===')
r3 = requests.get(f'{base}/{new_domain}', headers=hdrs)
print(f'HTTP {r3.status_code}')
if r3.status_code == 200:
    info = r3.json()
    print(f'status: {info.get("status")}')
    prov = info.get('provisioning', {})
    print(f'dnsStatus: {prov.get("dnsStatus")}')
    print(f'certStatus: {prov.get("certStatus")}')
    print(f'expectedIps: {prov.get("expectedIps")}')
    dns = prov.get('certChallengeDns', {})
    if dns:
        print(f'\nTXT DNS para SSL:')
        print(f'  Nome: {dns.get("domainName")}')
        print(f'  Valor: {dns.get("token")}')
    print(f'\nFULL:')
    print(json.dumps(info, indent=2))
else:
    print(r3.text[:400])

# 4. Listar todos os domínios
print(f'\n=== LISTA FINAL ===')
r4 = requests.get(base, headers=hdrs)
for d in r4.json().get('domains', []):
    print(f'  {d.get("domainName")} -> {d.get("status")}')
