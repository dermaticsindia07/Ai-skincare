// Simple service to submit lead data to a backend API (API Gateway + Lambda)
// Configure VITE_LEADS_API_URL in your environment (e.g., https://xxxx.execute-api.<region>.amazonaws.com/prod/leads)

export type LeadPayload = {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
};

export async function submitLead(payload: LeadPayload) {
  const endpoint = import.meta.env.VITE_LEADS_API_URL as string | undefined;
  if (!endpoint) {
    throw new Error('VITE_LEADS_API_URL is not configured. Set it in your .env or Amplify environment variables.');
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to submit lead (${res.status}): ${text || res.statusText}`);
  }

  return res.json().catch(() => ({}));
}