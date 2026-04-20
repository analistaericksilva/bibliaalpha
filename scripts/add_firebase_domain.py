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

project_id   = 'sentinela-ai-489015'
project_num  = '188238488601'
site         = 'sentinela-ai-489015'
new_domain   = 'bibliaalpha.org'
hdrs = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
base_cd = f'https://firebasehosting.googleapis.com/v1beta1/projects/{project_num}/sites/{site}/customDomains'

# 1. Adicionar bibliaalpha.org aos Auth authorized domains
print('=== Auth authorized domains ===')
auth_url = f'https://identitytoolkit.googleapis.com/v2/projects/{project_id}/config'
r_cfg = requests.get(auth_url, headers=hdrs)
if r_cfg.status_code == 200:
    cfg = r_cfg.json()
    domains = cfg.get('authorizedDomains', [])
    print(f'Atual: {domains}')
    if new_domain not in domains:
        domains.append(new_domain)
        r_p = requests.patch(auth_url, headers=hdrs,
            params={'updateMask': 'authorizedDomains'},
            json={'authorizedDomains': domains})
        print(f'PATCH add {new_domain}: HTTP {r_p.status_code}')
        if r_p.status_code == 200:
            print(f'OK -- {new_domain} adicionado aos auth domains')
        else:
            print(r_p.text[:300])
    else:
        print(f'{new_domain} ja esta nos auth domains')
else:
    print(f'GET config falhou: HTTP {r_cfg.status_code}')
    print(r_cfg.text[:300])

# 2. GET status do custom domain
print(f'\n=== GET status {new_domain} ===')
r_get = requests.get(f'{base_cd}/{new_domain}', headers=hdrs)
print(f'HTTP {r_get.status_code}')
if r_get.status_code == 200:
    info = r_get.json()
    print(f'hostState:      {info.get("hostState")}')
    print(f'ownershipState: {info.get("ownershipState")}')
    cert = info.get("cert", {})
    print(f'cert.type:      {cert.get("type")}')
    print(f'cert.state:     {cert.get("state")}')
    dns = info.get("requiredDnsUpdates", {})
    desired = dns.get("desired", [])
    discovered = dns.get("discovered", [])
    print(f'desired:    {json.dumps(desired)}')
    print(f'discovered: {json.dumps(discovered)}')
else:
    print(r_get.text[:400])

# 3. Lista todos custom domains
print(f'\n=== LISTA customDomains ===')
r_list = requests.get(base_cd, headers=hdrs)
print(f'HTTP {r_list.status_code}')
for cd in r_list.json().get('customDomains', []):
    print(f"  {cd['name'].split('/')[-1]} -- host:{cd.get('hostState')} owner:{cd.get('ownershipState')}")
