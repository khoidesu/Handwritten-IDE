import requests

payload = {
    "source_code": 'print("Hello World")',
    "language_id": 71   # Python 3
}

response = requests.post(
    "http://localhost:2358/submissions?wait=true",
    json=payload
)

print("Status:", response.status_code)
print("Headers:", response.headers["Content-Type"])
print(response.text)