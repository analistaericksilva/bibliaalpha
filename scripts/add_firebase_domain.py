import json, sys, os, time, requests
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

PROJECT_ID = 'sentinela-ai-489015'
SITE_ID    = 'sentinela-ai-489015'
DOMAIN     = 'bibliaalpha.studiologos.com.br'

legacy_base  = f'https://firebasehosting.googleapis.com/v1beta1/sites/{SITE_ID}/domains'
modern_base  = f'https://firebasehosting.googleapis.com/v1beta1/projects/{PROJECT_ID}/sites/{SITE_ID}/customDomains'

print(f"Site: {SITE_ID}  |  Dominio: {DOMAIN}")
print()

def show_dns_info(data):
    provision = data.get('provisioning', data.get('certDetails', {}))
    recs = provision.get('dnsRecords', []) or provision.get('expectedDnsRecords', [])
    expected_ips = provision.get('expectedIps', [])
    cert_dns = provision.get('certChallengeDns', {})

    print("\n" + "="*60)
    print("REGISTROS DNS NECESSARIOS NA HOSTINGER:")
    print("="*60)

    if recs:
        for r in recs:
            print(f"  {r.get('type'):5} | {r.get('domainName', DOMAIN):45} | {r.get('rdata','')}")
    elif expected_ips:
        print(f"  A     | {DOMAIN:45} | {', '.join(expected_ips)}")
        print(f"  CNAME | bibliaalpha.studiologos.com.br               | sentinela-ai-489015.web.app")
    else:
        print(f"  CNAME | bibliaalpha                                   | sentinela-ai-489015.web.app")

    if cert_dns:
        print(f"\n  (SSL cert challenge DNS):")
        print(f"  TXT   | {cert_dns.get('domainName','')} | {cert_dns.get('token','')}")
    print("="*60)

r1 = requests.get(f'{legacy_base}/{DOMAIN}', headers=hdrs)
print(f"Dominio atual (legacy API): {r1.status_code}")
if r1.status_code == 200:
    d = r1.json()
    status = d.get('status', '')
    print(f"Status: {status}")
    show_dns_info(d)

    if status in ('DOMAIN_VERIFICATION_LOST', 'PENDING'):
        print(f"\nTentando modern API /customDomains para {DOMAIN}...")
        modern_r = requests.post(
            modern_base,
            headers=hdrs,
            json={'customDomainId': DOMAIN}
        )
        print(f"Modern API add: {modern_r.status_code}")
        print(json.dumps(modern_r.json(), indent=2)[:1000])

        if modern_r.status_code not in (200, 409):
            print("\nTentando com body alternativo...")
            alt_r = requests.post(
                modern_base,
                headers=hdrs,
                params={'customDomainId': DOMAIN},
                json={}
            )
            print(f"Alt add: {alt_r.status_code}")
            print(json.dumps(alt_r.json(), indent=2)[:800])
else:
    print("Dominio nao existe — adicionando via modern API...")
    modern_r = requests.post(
        modern_base,
        headers=hdrs,
        json={'customDomainId': DOMAIN}
    )
    print(f"Modern API add: {modern_r.status_code}")
    print(json.dumps(modern_r.json(), indent=2)[:1000])

r2 = requests.get(f'{legacy_base}/{DOMAIN}', headers=hdrs)
print(f"\nStatus final ({r2.status_code}): {r2.json().get('status','?') if r2.status_code==200 else r2.text[:200]}")
