import os, sys, json, requests, time

API_TOKEN = os.environ.get('HOSTINGER_API_TOKEN', '')
DOMAIN = 'studiologos.com.br'
SUBDOMAIN = 'bibliaalpha'
CUSTOM_DOMAIN = f'{SUBDOMAIN}.{DOMAIN}'

if not API_TOKEN:
    print("AVISO: HOSTINGER_API_TOKEN nao definido — pulando alteracao DNS automatica")
    print("ACAO MANUAL NECESSARIA:")
    print(f"  1. Acesse hPanel Hostinger -> {DOMAIN} -> DNS Zone")
    print(f"  2. Remova: A | {SUBDOMAIN} | 5.183.10.171")
    print(f"  3. Adicione: CNAME | {SUBDOMAIN} | bibliaalpha.web.app")
    sys.exit(0)

BASE = "https://api.hostinger.com/v1"
headers = {"Authorization": f"Bearer {API_TOKEN}", "Content-Type": "application/json"}

r = requests.get(f"{BASE}/dns/zones/{DOMAIN}/records", headers=headers)
print(f"Buscar registros DNS: {r.status_code}")
if r.status_code != 200:
    print(f"Erro: {r.text[:300]}")
    sys.exit(1)

records = r.json().get("data", r.json())
old_record = None
for rec in records:
    name = rec.get("name", "")
    rtype = rec.get("type", "")
    if SUBDOMAIN in name and rtype == "A":
        old_record = rec
        print(f"Encontrado registro A antigo: {rec}")
        break

if old_record:
    del_r = requests.delete(
        f"{BASE}/dns/zones/{DOMAIN}/records/{old_record['id']}",
        headers=headers
    )
    print(f"Remover registro A antigo: {del_r.status_code}")

new_record = {"type": "CNAME", "name": f"{SUBDOMAIN}", "content": "bibliaalpha.web.app", "ttl": 3600}
add_r = requests.post(f"{BASE}/dns/zones/{DOMAIN}/records", headers=headers, json=new_record)
print(f"Adicionar CNAME: {add_r.status_code}")
print(add_r.text[:500])

if add_r.status_code in (200, 201):
    print(f"\nSUCESSO: CNAME {SUBDOMAIN} -> bibliaalpha.web.app adicionado!")
    print("Aguarde 1-4h para propagacao DNS.")
else:
    print("FALHA ao adicionar CNAME. Acao manual necessaria no hPanel.")
