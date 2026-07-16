import requests

res = requests.post("https://shlok0829-vortex-siem-backend.hf.space/run/get_users", json={"data": []})
print(res.status_code)
print(res.text[:500])
