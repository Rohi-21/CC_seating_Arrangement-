// src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";


/** small fetch wrapper */
async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers = new Headers(opts.headers || {});
  headers.set("Content-Type", "application/json");

  const token = localStorage.getItem("auth_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const msg = text || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

/* STUDENTS */
export async function getStudents() {
  return request<any[]>("/api/students");
}

export async function addStudent(payload: any) {
  return request<any>("/api/students", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ROOMS */
export async function getRooms() {
  return request<any[]>("/api/rooms");
}

export async function addRoom(payload: any) {
  return request<any>("/api/rooms", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* EXAMS */
export async function getExams() {
  return request<any[]>("/api/exams");
}

export async function addExam(payload: any) {
  return request<any>("/api/exams", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* SEATING ALLOCATIONS */
export async function getSeatingAllocations(query = "") {
  const q = query ? `?${query}` : "";
  return request<any[]>(`/api/seating_allocations${q}`);
}

export async function postSeatingAllocations(payload: any) {
  return request<any>("/api/seating_allocations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteSeatingAllocations(query = "") {
  const q = query ? `?${query}` : "";
  return request<any>(`/api/seating_allocations${q}`, { method: "DELETE" });
}

/* STATS */
export async function getStats() {
  return request<any>("/api/stats");
}

/* AUTH helpers */
export async function loginUser({ email, password }: { email: string; password: string; }) {
  return request<{ token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser({ name, email, password }: { name: string; email: string; password: string; }) {
  return request<any>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function validateToken() {
  return request<any>("/api/auth/validate");
}
