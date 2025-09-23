import requests
import jsoncd

API_KEY = "AIzaSyAbOZFwto-ii0IPexvpNwGqZOt42jPUbzE"

url = "http://testsafebrowsing.appspot.com/s/malware.html"  # a safe URL to test

endpoint = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={API_KEY}"

payload = {
    "client": {
        "clientId": "yourcompanyname",
        "clientVersion": "1.0"
    },
    "threatInfo": {
        "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "POTENTIALLY_HARMFUL_APPLICATION"],
        "platformTypes": ["ANY_PLATFORM"],
        "threatEntryTypes": ["URL"],
        "threatEntries": [
            {"url": url}
        ]
    }
}

response = requests.post(endpoint, json=payload)
print(response.status_code)
print(response.text)
