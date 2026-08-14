import requests

JUDGE0_URL = "http://localhost:2358"

def run_python(code: str):
    payload = {
        "source_code": code,
        "language_id": 71  # Python
    }

    response = requests.post(
        f"{JUDGE0_URL}/submissions?wait=true",
        json=payload
    )

    return response.json()