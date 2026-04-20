import ftplib, os, sys, time, glob, pathlib

FTP_SERVER   = os.environ['FTP_SERVER']
FTP_USER     = os.environ['FTP_USERNAME']
FTP_PASS     = os.environ['FTP_PASSWORD']
LOCAL_DIR    = 'dist'
REMOTE_DIR   = '/'

def connect():
    ftp = ftplib.FTP()
    ftp.connect(FTP_SERVER, 21, timeout=60)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.set_pasv(True)
    print(f"Conectado: {ftp.getwelcome()[:80]}")
    return ftp

def upload_file(ftp, local_path, remote_path):
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {remote_path}', f)

def ensure_dir(ftp, path):
    parts = [p for p in path.strip('/').split('/') if p]
    current = '/'
    for part in parts:
        current = current.rstrip('/') + '/' + part
        try:
            ftp.cwd(current)
            ftp.cwd('/')
        except:
            try:
                ftp.mkd(current)
                print(f"  Diretorio criado: {current}")
            except:
                pass

print("=== FTP Deploy para Hostinger ===")
print(f"Server: {FTP_SERVER}")
print(f"User: {FTP_USER[:4]}***")

ftp = connect()
ftp.cwd(REMOTE_DIR)
print(f"CWD: {ftp.pwd()}")

local = pathlib.Path(LOCAL_DIR)
files = sorted(local.rglob('*'))
print(f"Arquivos a enviar: {sum(1 for f in files if f.is_file())}")

errors = []
uploaded = 0
for f in files:
    if not f.is_file():
        continue
    rel = str(f.relative_to(local))
    remote_path = REMOTE_DIR.rstrip('/') + '/' + rel.replace(os.sep, '/')
    remote_dir = str(pathlib.Path(remote_path).parent)

    for attempt in range(3):
        try:
            if remote_dir != '/':
                ensure_dir(ftp, remote_dir)
                ftp.cwd(REMOTE_DIR)
            upload_file(ftp, str(f), remote_path)
            uploaded += 1
            if uploaded % 20 == 0:
                print(f"  {uploaded} arquivos enviados...")
            break
        except (ftplib.error_temp, ConnectionResetError, BrokenPipeError, OSError) as e:
            print(f"  Tentativa {attempt+1} falhou para {rel}: {e}")
            time.sleep(3)
            try:
                ftp.quit()
            except:
                pass
            ftp = connect()
            ftp.cwd(REMOTE_DIR)
        except Exception as e:
            errors.append((rel, str(e)))
            print(f"  ERRO permanente {rel}: {e}")
            break

ftp.quit()
print(f"\nTotal enviado: {uploaded}")
print(f"Erros: {len(errors)}")
for rel, err in errors:
    print(f"  {rel}: {err}")
if errors:
    sys.exit(1)
print("Deploy FTP concluido com sucesso!")
