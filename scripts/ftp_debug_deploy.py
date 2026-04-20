import ftplib, os, sys, pathlib, time, subprocess

SERVER = os.environ['FTP_SERVER']
USER = os.environ['FTP_USERNAME']
PASS = os.environ['FTP_PASSWORD']
SITE_URL = os.environ.get('SITE_URL', 'https://bibliaalpha.studiologos.com.br')

def connect():
    ftp = ftplib.FTP()
    ftp.connect(SERVER, 21, timeout=60)
    ftp.login(USER, PASS)
    ftp.set_pasv(True)
    return ftp

print(f"=== Conectando em {SERVER} ===")
ftp = connect()
print("OK:", ftp.getwelcome()[:80])
print("PWD inicial:", ftp.pwd())

# Descobrir diretorio raiz do site
candidates = ['public_html', 'bibliaalpha.studiologos.com.br', 'httpdocs', 'www']
target_dir = None
for candidate in candidates:
    try:
        ftp.cwd('/')
        ftp.cwd(candidate)
        target_dir = candidate
        break
    except:
        print(f"  nao existe: {candidate}")

if not target_dir:
    print("ERRO: Nenhum diretorio alvo encontrado!")
    sys.exit(1)

print(f"\n=== Target: {target_dir} ===")
print("=== Conteudo ANTES do deploy ===")
ftp.cwd('/')
ftp.cwd(target_dir)
ftp.retrlines('LIST')
try:
    ftp.cwd('assets')
    print("--- assets/ ---")
    ftp.retrlines('LIST')
except:
    print("  (sem pasta assets/ ainda)")

# Fazer deploy
local = pathlib.Path('dist')
all_files = sorted(f for f in local.rglob('*') if f.is_file())
print(f"\n=== Enviando {len(all_files)} arquivos ===")
for f in all_files:
    print(f"  -> {f.relative_to(local)}")

errors = []
uploaded = 0

for f in all_files:
    rel = str(f.relative_to(local)).replace(os.sep, '/')
    parts = rel.split('/')

    ftp.cwd('/')
    ftp.cwd(target_dir)

    if len(parts) > 1:
        for part in parts[:-1]:
            try:
                ftp.cwd(part)
            except:
                try:
                    ftp.mkd(part)
                    ftp.cwd(part)
                except Exception as e:
                    print(f"  Erro pasta {part}: {e}")

    for attempt in range(3):
        try:
            with open(str(f), 'rb') as fp:
                ftp.storbinary(f'STOR {parts[-1]}', fp)
            uploaded += 1
            size = f.stat().st_size
            print(f"  OK [{uploaded}] {rel} ({size} bytes)")
            break
        except Exception as e:
            print(f"  Tentativa {attempt+1} ERRO {rel}: {e}")
            time.sleep(3)
            try:
                ftp.quit()
            except:
                pass
            ftp = connect()
            ftp.cwd('/')
            ftp.cwd(target_dir)
            if len(parts) > 1:
                for part in parts[:-1]:
                    try:
                        ftp.cwd(part)
                    except:
                        pass
    else:
        errors.append(rel)

print("\n=== Conteudo APOS deploy ===")
ftp.cwd('/')
ftp.cwd(target_dir)
ftp.retrlines('LIST')
try:
    ftp.cwd('assets')
    print("--- assets/ ---")
    ftp.retrlines('LIST')
except:
    pass

try:
    ftp.quit()
except:
    pass

print(f"\n=== RESULTADO ===")
print(f"Enviados: {uploaded}/{len(all_files)}")
if errors:
    print(f"ERROS ({len(errors)}):")
    for e in errors:
        print(f"  {e}")
    sys.exit(1)
print("Deploy FTP concluido!")

# Purge LiteSpeed cache
print(f"\n=== Purge LiteSpeed Cache ===")
import urllib.request, ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
for purge_url in [
    f"{SITE_URL}/?LSCWP_CTRL=PURGE_ALL",
    f"{SITE_URL}/?lscwp_ctrl=before_purge_all",
    f"{SITE_URL}/",
]:
    try:
        req = urllib.request.Request(purge_url, headers={'Cache-Control': 'no-cache', 'Pragma': 'no-cache'})
        resp = urllib.request.urlopen(req, timeout=10, context=ctx)
        print(f"  {purge_url} -> {resp.status}")
    except Exception as e:
        print(f"  {purge_url} -> {e}")
print("Cache purge tentado!")
