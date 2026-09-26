const BACKEND_URL =
  (import.meta as any).env?.VITE_BACKEND_URL ?? "http://localhost:8000";

async function parseResponse(response: Response) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `Backend error ${response.status}`);
  }
  return response.json();
}

export async function uploadCaseFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${BACKEND_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });
  return parseResponse(response);
}

export async function analyzeGraph() {
  const response = await fetch(`${BACKEND_URL}/api/analyze-graph`, {
    method: "POST",
  });
  return parseResponse(response);
}

export async function getGraph() {
  const response = await fetch(`${BACKEND_URL}/api/graph`);
  return parseResponse(response);
}

export async function sendChatMessage(message: string) {
  const response = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  return parseResponse(response);
}