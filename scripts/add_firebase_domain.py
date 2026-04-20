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

project = 'sentinela-ai-489015'
site = 'sentinela-ai-489015'
old_domain = 'bibliaalpha.studiologos.com.br'
new_domain = 'bibliaalpha.org'
hdrs = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
hosting_base = f'https://firebasehosting.googleapis.com/v1beta1/sites/{site}/domains'

# PASSO 1: Adicionar bibliaalpha.org ao Firebase Auth authorized domains
print('=== PASSO 1: Firebase Auth authorized domains ===')
auth_cfg_url = f'https://identitytoolkit.googleapis.com/v2/projects/{project}/config'
r_cfg = requests.get(auth_cfg_url, headers=hdrs)
print(f'GET auth config: HTTP {r_cfg.status_code}')
if r_cfg.status_code == 200:
    cfg = r_cfg.json()
    domains = cfg.get('authorizedDomains', [])
    print(f'Dominios autorizados atuais: {domains}')
    if new_domain not in domains:
        domains.append(new_domain)
        patch = {'authorizedDomains': domains}
        r_patch = requests.patch(
            auth_cfg_url,
            headers=hdrs,
            params={'updateMask': 'authorizedDomains'},
            json=patch
        )
        print(f'PATCH auth domains: HTTP {r_patch.status_code}')
        if r_patch.status_code == 200:
            print(f'✅ {new_domain} adicionado aos authorized domains')
        else:
            print(r_patch.text[:300])
    else:
        print(f'{new_domain} ja estava na lista')

# PASSO 2: DELETE domínio antigo do Hosting
print(f'\n=== PASSO 2: DELETE {old_domain} do Hosting ===')
r_del = requests.delete(f'{hosting_base}/{old_domain}', headers=hdrs)
print(f'DELETE: HTTP {r_del.status_code}')
print(r_del.text[:200] if r_del.text.strip() else '(vazio — OK)')

# PASSO 3: POST novo domínio
print(f'\n=== PASSO 3: POST {new_domain} no Hosting ===')
r_post = requests.post(hosting_base, headers=hdrs, json={'domainName': new_domain, 'site': site})
print(f'POST: HTTP {r_post.status_code}')
resp_data = r_post.json()
print(json.dumps(resp_data, indent=2))

# PASSO 4: GET status e registros DNS
print(f'\n=== PASSO 4: Status e DNS records ===')
r_get = requests.get(f'{hosting_base}/{new_domain}', headers=hdrs)
print(f'GET: HTTP {r_get.status_code}')
if r_get.status_code == 200:
    info = r_get.json()
    print(f'status: {info.get("status")}')
    prov = info.get('provisioning', {})
    print(f'dnsStatus: {prov.get("dnsStatus")}')
    print(f'certStatus: {prov.get("certStatus")}')
    print(f'expectedIps: {prov.get("expectedIps", [])}')
    dns_chal = prov.get('certChallengeDns', {})
    if dns_chal:
        print(f'\nTXT p/ SSL cert:')
        print(f'  Nome:  {dns_chal.get("domainName")}')
        print(f'  Valor: {dns_chal.get("token")}')
    dom_chal = prov.get('dnsFetchError', '')
    if dom_chal:
        print(f'dnsFetchError: {dom_chal}')
    print(f'\nFULL provisioning:')
    print(json.dumps(prov, indent=2))
else:
    print(r_get.text[:400])

# PASSO 5: Listar todos os domínios
print(f'\n=== LISTA FINAL ===')
r_list = requests.get(hosting_base, headers=hdrs)
for d_item in r_list.json().get('domains', []):
    print(f'  {d_item.get("domainName"):40} {d_item.get("status")}')
