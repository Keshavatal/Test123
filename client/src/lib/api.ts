
async function request<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred',
    }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  get: <T = any>(url: string) => request<T>(url),
  
  post: <T = any>(url: string, data: any) =>
    request<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  put: <T = any>(url: string, data: any) =>
    request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: <T = any>(url: string) =>
    request<T>(url, {
      method: 'DELETE',
    }),
};
