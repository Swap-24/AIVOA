import axios from 'axios';

const client = axios.create({
  baseURL: '/api/complaint',
  timeout: 30000,
});

export async function extractText(sessionId, message, currentForm) {
  const { data } = await client.post('/extract', {
    session_id: sessionId,
    message,
    current_form: currentForm ?? null,
  });
  return data;
}

export async function extractPdf(sessionId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post('/extract-pdf', formData, {
    params: { session_id: sessionId },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function commitComplaint(form) {
  const { data } = await client.post('/commit', { form });
  return data;
}

export async function fetchComplaintHistory(limit = 50) {
  const { data } = await client.get('/history', { params: { limit } });
  return data;
}
