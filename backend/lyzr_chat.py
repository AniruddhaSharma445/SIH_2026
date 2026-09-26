import httpx
import os

LYZR_API_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/"
LYZR_API_KEY = os.getenv("LYZR_API_KEY", "sk-default-k34ndKEmKbROwdK9s35sUAQs4su3sKyr")
DEFAULT_AGENT_ID = "6aabf939be73873d04ecd627"

async def call_lyzr_agent(
    message: str,
    user_id: str = "aniruddhasharma141104@gmail.com",
    session_id: str = "6aabf939be73873d04ecd627-950i7xmw",
    agent_id: str = DEFAULT_AGENT_ID
) -> dict:
    headers = {
        "Content-Type": "application/json",
        "x-api-key": LYZR_API_KEY
    }
    
    payload = {
        "user_id": user_id,
        "agent_id": agent_id,
        "session_id": session_id,
        "message": message
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(LYZR_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()