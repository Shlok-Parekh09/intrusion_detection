import urllib.request
import json
req = urllib.request.Request(
    'https://shlok0829-vortex-siem-backend.hf.space/run/get_graph', 
    data=b'{"data":[]}', 
    headers={'Content-Type': 'application/json'}
)
res = urllib.request.urlopen(req)
data = json.loads(res.read())
print(json.dumps(data, indent=2))
