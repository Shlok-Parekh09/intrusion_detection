import requests

res = requests.post("https://shlok0829-vortex-siem-backend.hf.space/call/get_graph", json={"data": []})
print(res.json())
