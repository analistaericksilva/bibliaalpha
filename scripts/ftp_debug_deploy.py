import ftplib, os, sys, pathlib, time

SERVER = os.environ['FTP_SERVER']
USER = os.environ['FTP_USERNAME']
PASS = os.environ['FTP_PASSWORD']

def connect():
    ftp = ftplib.FTP()
    ftp.connect(SERVER, 21, timeout=60)
    ftp.login(USER, PASS)
    ftp.set_pasv(True)
    return ftp

print(f"=== Conectando em {SERVER} ===")
try:
    ftp = connect()
    print("OK:", ftp.getwelcome()[:80])
    print("PWD:", ftp.pwd())
    print("\n=== Listagem raiz ===")
    ftp.retrlines('LIST')
except Exception as e:
    print(f"ERRO conexao: {e}")
    sys.exit(1)

candidates = ['public_html', 'bibliaalpha.stuiologos.com.br', 'httpdocs', 'www']
target_dir = None
for candidate in candidates:
    try:
        ftp.cwd('/')
        ftp.cwd(candidate)
        print(f"\n=== Encontrado: {candidate} ===")
        ftp.retrlines('LIST')
        target_dir = candidate
        break
    except:
        print(f"  nao existe: {candidate}")

if not target_dir:
    print("ERRO: Nenhum diretorio alvo encontrado!")
    sys.exit(1)

print(f"\n=== Deploy para: {target_dir} ===")

local = pathlib.Path('dist')
all_files = sorted(f for f in local.rglob('*') if f.is_file())
print(f"Enviando {len(all_files)} arquivos...")

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
            if uploaded % 20 == 0 or parts[-1] in ('index.html', 'sw.js', '.htaccess'):
                print(f"  [{uploaded}] {rel}")
            break
        except Exception as e:
            print(f"  Tentativa {attempt+1} erro {rel}: {e}")
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

try:
    ftp.quit()
except:
    pass

print(f"\n=== RESULTADO ===")
print(f"Enviados: {uploaded}/{len(all_files)}")
print(f"Erros: {len(errors)}")
for e in errors:
    print(f"  ERRO: {e}")
if errors:
    sys.exit(1)
print("Deploy FTP concluido com sucesso!")
