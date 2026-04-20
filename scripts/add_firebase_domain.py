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
hdrs = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
base = f'https://firebasehosting.googleapis.com/v1beta1/sites/{site}/domains'

# GET domínio existente para ver formato
print('=== GET bibliaalpha.studiologos.com.br (existente ATIVO) ===')
r1 = requests.get(f'{base}/bibliaalpha.studiologos.com.br', headers=hdrs)
print(json.dumps(r1.json(), indent=2))

# Tentar POST com site como nome completo do recurso
print()
print('=== POST bibliaalpha.org com site como resource name ===')
body = {
    'domainName': 'bibliaalpha.org',
    'site': f'projects/188238488601/sites/{site}'
}
r2 = requests.post(base, headers=hdrs, json=body)
print(f'HTTP {r2.status_code}')
print(json.dumps(r2.json(), indent=2)[:600])
