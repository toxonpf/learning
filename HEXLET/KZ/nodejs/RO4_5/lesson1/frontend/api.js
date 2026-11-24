import { API_URL } from './config.js';
import { getAccessToken, setGuest } from './authState.js';
export class APIError extends Error {
    constructor(message, status) { super(message); this.status = status; }
}
export async function apiFetch(path, { body, headers = {}, ...options } = {}) {
    const token = getAccessToken();
    const form = body instanceof FormData;
    let response;
    try {
        response = await fetch(API_URL + path, { ...options,
            headers: { ...(body !== undefined && !form ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
            ...(body !== undefined ? { body: form ? body : JSON.stringify(body) } : {}) });
    } catch { throw new APIError('Сервер недоступен. Проверьте подключение.', 0); }
    const data = response.status === 204 ? null : await response.json();
    if (response.status === 401) {
        setGuest();
        window.dispatchEvent(new Event('auth-expired'));
    }
    if (!response.ok) throw new APIError(data?.error || `HTTP ${response.status}`, response.status);
    return data;
}
