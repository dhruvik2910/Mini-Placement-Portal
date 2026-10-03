const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export class ApiError extends Error {
  statusCode: number;
  errors?: Array<{ field?: string; message: string }>;

  constructor(message: string, statusCode = 500, errors?: Array<{ field?: string; message: string }>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('placement_token') : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data.message || `Request failed with status ${response.status}`,
      response.status,
      data.errors
    );
  }

  return data.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: any) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: any) =>
    request<T>(path, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: any) =>
    request<T>(path, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export async function downloadCsv(path: string, defaultFilename: string): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('placement_token') : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new ApiError(
      errorJson.message || `Export failed with status ${response.status}`,
      response.status
    );
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const disposition = response.headers.get('content-disposition');
  let filename = defaultFilename;
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Securely opens a protected PDF resume in a new browser tab.
 * Uses Authorization: Bearer header and converts response to an in-memory Blob URL,
 * keeping JWT tokens completely out of the browser URL and history.
 */
export async function openResume(studentProfileId?: string): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('placement_token') : null;
  if (!token) {
    throw new ApiError('Authentication token not found. Please log in.', 401);
  }

  const endpoint = studentProfileId
    ? `/student/resume/${studentProfileId}`
    : '/student/resume';

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new ApiError(
      errorJson.message || `Failed to load resume (HTTP ${res.status})`,
      res.status
    );
  }

  const blob = await res.blob();
  const pdfBlob = new Blob([blob], { type: 'application/pdf' });
  const objectUrl = window.URL.createObjectURL(pdfBlob);
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
}
