import json
import os
import requests
import google.oauth2.service_account as sa
import google.auth.transport.requests

creds_info = json.loads(os.environ['SA_JSON'])
creds = sa.Credentials.from_service_account_info(
    creds_info,
    scopes=['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase']
)
auth_req = google.auth.transport.requests.Request()
creds.refresh(auth_req)
token = creds.token

project_id = 'sentinela-ai-489015'
project_num = '188238488601'
site = 'sentinela-ai-489015'
hdrs = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
base_cd = f'https://firebasehosting.googleapis.com/v1beta1/projects/{project_num}/sites/{site}/customDomains'

print('=== Auth authorized domains ===')
auth_url = f'https://identitytoolkit.googleapis.com/v2/projects/{project_id}/config'
r_cfg = requests.get(auth_url, headers=hdrs)
if r_cfg.status_code == 200:
    cfg = r_cfg.json()
    domains = cfg.get('authorizedDomains', [])
    print(f'Atual: {domains}')
    changed = False
    for new_domain in ['bibliaalpha.org', 'www.bibliaalpha.org']:
        if new_domain not in domains:
            domains.append(new_domain)
            changed = True
            print(f'Adicionando: {new_domain}')
        else:
            print(f'Ja existe: {new_domain}')
    if changed:
        r_p = requests.patch(auth_url, headers=hdrs, params={'updateMask': 'authorizedDomains'}, json={'authorizedDomains': domains})
        print(f'PATCH: HTTP {r_p.status_code}')
        if r_p.status_code == 200:
            print('OK -- dominios atualizados')
        else:
            print(r_p.text[:300])
    else:
        print('Nenhuma alteracao necessaria')
else:
    print(f'GET config falhou: HTTP {r_cfg.status_code}')
    print(r_cfg.text[:300])

print('\n=== LISTA customDomains ===')
r_list = requests.get(base_cd, headers=hdrs)
for cd in r_list.json().get('customDomains', []):
    print(f"  {cd['name'].split('/')[-1]} -- host:{cd.get('hostState')} owner:{cd.get('ownershipState')}")
