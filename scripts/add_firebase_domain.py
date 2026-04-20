import json, sys, os, requests
import google.auth, google.auth.transport.requests
from google.oauth2 import service_account

SA_JSON = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS_JSON', '')
if not SA_JSON:
    print("ERRO: GOOGLE_APPLICATION_CREDENTIALS_JSON nao definido")
    sys.exit(1)

with open('/tmp/sa.json', 'w') as f:
    f.write(SA_JSON)

credentials = service_account.Credentials.from_service_account_file(
    '/tmp/sa.json',
    scopes=['https://www.googleapis.com/auth/firebase']
)
auth_req = google.auth.transport.requests.Request()
credentials.refresh(auth_req)
token = credentials.token

hdrs = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

SITE_ID = 'sentinela-ai-489015'
CUSTOM_DOMAIN = 'bibliaalpha.studiologos.com.br'
base_url = f'https://firebasehosting.googleapis.com/v1beta1/sites/{SITE_ID}/domains'

print(f"Site: {SITE_ID}")
print(f"Dominio: {CUSTOM_DOMAIN}")
print()

r = requests.get(base_url, headers=hdrs)
print(f"Dominios existentes ({r.status_code}):")
for d in r.json().get('domains', []):
    print(f"  {d.get('domainName')} | {d.get('status')}")

detail_r = requests.get(f"{base_url}/{CUSTOM_DOMAIN}", headers=hdrs)
print(f"\nDetalhes do dominio ({detail_r.status_code}):")
if detail_r.status_code == 200:
    detail = detail_r.json()
    print(json.dumps(detail, indent=2))
    status = detail.get('status', '')
    provision = detail.get('provisioning', {})
    dns_records = provision.get('dnsRecords', []) or provision.get('expectedDnsRecords', [])

    if status == 'DOMAIN_VERIFICATION_LOST':
        print("\nStatus DOMAIN_VERIFICATION_LOST detectado — deletando e re-adicionando...")
        del_r = requests.delete(f"{base_url}/{CUSTOM_DOMAIN}", headers=hdrs)
        print(f"Delete: {del_r.status_code}")
        import time
        time.sleep(2)
        add_r = requests.post(base_url, headers=hdrs, json={'domainName': CUSTOM_DOMAIN})
        print(f"Re-adicionar: {add_r.status_code}")
        resp = add_r.json()
        print(json.dumps(resp, indent=2))
        provision = resp.get('provisioning', {})
        dns_records = provision.get('dnsRecords', []) or provision.get('expectedDnsRecords', [])

    print("\n" + "="*60)
    print("REGISTROS DNS NECESSARIOS NA HOSTINGER:")
    print("="*60)
    if dns_records:
        for rec in dns_records:
            print(f"  Tipo : {rec.get('type')}")
            print(f"  Host : {rec.get('domainName', CUSTOM_DOMAIN)}")
            print(f"  Valor: {rec.get('rdata', rec.get('value', ''))}")
            print()
    else:
        print(f"  CNAME: bibliaalpha -> sentinela-ai-489015.web.app")
    print("="*60)
else:
    print(detail_r.text[:500])
    print("\nDominio nao encontrado — adicionando...")
    add_r = requests.post(base_url, headers=hdrs, json={'domainName': CUSTOM_DOMAIN})
    print(f"Adicionar: {add_r.status_code}")
    print(json.dumps(add_r.json(), indent=2))
