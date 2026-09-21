import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get('GROQ_API_KEY')

r = requests.get('https://api.groq.com/openai/v1/models', headers={'Authorization': f'Bearer {api_key}'})
data = r.json()
print([m['id'] for m in data.get('data', [])])
