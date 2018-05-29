export default async function postJsonData(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const jsonResponse = await response.json();
    throw new Error(jsonResponse.message || 'Unknown error');
  }

  return response.json();
}
