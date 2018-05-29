export default function basicAuthHeader(username, password) {
  const encoded = Buffer(`${username}:${password}`).toString('base64');
  return `Basic ${encoded}`;
}
