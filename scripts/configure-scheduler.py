"""Operator-only setup. Requires requests and PyNaCl; never exposes secret values.
Run with --apply after reviewing the live callback. Environment credentials only.
"""
import argparse
import base64
import os
import requests
from nacl.public import PublicKey, SealedBox

parser = argparse.ArgumentParser()
parser.add_argument('--apply', action='store_true')
args = parser.parse_args()
origin = 'https://hush-and-flow-studio.lovable.app'
repo = '/repos/elgizaiiio/ceyo-private-scheduler'
secret = os.environ['LOVABLE_CRON_SECRET']
headers = {
    'Authorization': 'Bearer ' + os.environ['LOVABLE_API_KEY'],
    'X-Connection-Api-Key': os.environ['GITHUB_API_KEY'],
    'Accept': 'application/vnd.github+json',
}

def github(method, path, body=None):
    response = requests.request(method, 'https://connector-gateway.lovable.dev/github' + repo + path,
                                headers=headers, json=body, timeout=60)
    if not response.ok:
        raise RuntimeError('Scheduler configuration refused: HTTP ' + str(response.status_code))
    return response.json() if response.content else None

if not args.apply:
    print('Dry run; no changes. Use --apply to save encrypted scheduler credentials and verify callback.')
else:
    public = github('GET', '/actions/secrets/public-key')
    encrypted = base64.b64encode(SealedBox(PublicKey(base64.b64decode(public['key']))).encrypt(secret.encode())).decode()
    github('PUT', '/actions/secrets/CEYO_CRON_SECRET', {'key_id': public['key_id'], 'encrypted_value': encrypted})
    variables = github('GET', '/actions/variables')
    exists = any(v['name'] == 'CEYO_APP_URL' for v in variables.get('variables', []))
    github('PATCH' if exists else 'POST', '/actions/variables/CEYO_APP_URL' if exists else '/actions/variables',
           {'name': 'CEYO_APP_URL', 'value': origin})
    print('Encrypted credential and app address saved.')
    # Verify live handler before enabling any recurring execution. Do not follow redirects with auth.
    response = requests.post(origin + '/api/public/ceyo-routines',
                             headers={'Authorization': 'Bearer ' + secret}, timeout=600, allow_redirects=False)
    print('Live callback HTTP:', response.status_code)
    if not response.ok or 'application/json' not in response.headers.get('Content-Type', ''):
        raise RuntimeError('Live callback unavailable; scheduler remains disabled.')
    data = response.json()
    if not all(key in data for key in ['results', 'jobs', 'phone']):
        raise RuntimeError('Unexpected callback result; scheduler remains disabled.')
    github('PUT', '/actions/workflows/agent-routines.yml/enable')
    github('POST', '/actions/workflows/agent-routines.yml/dispatches', {'ref': 'main'})
    print('Scheduler enabled and verification run requested. Check its completed result before claiming success.')