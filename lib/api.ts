// lib/api.ts
import axios, { AxiosError } from 'axios';

// Khai báo base URL
const BASE = 'http://localhost:4000/';

// Tạo 1 instance để dùng lại
const api = axios.create({
  baseURL: BASE,
  timeout: 10000, // 10s
  headers: {
    'Content-Type': 'application/json',
  },
});

// Hàm get dữ liệu
export async function getData<T = any>(url: string): Promise<T | null> {
    try {
      const res = await api.get<T>(url);
      return res.data;
    } catch (err) {
      const e = err as AxiosError;
      console.error('❌ API GET error:', e.message);
      return null;
    }
  }
  
  // Hàm post dữ liệu
  export async function postData<T = any>(url: string, data: any): Promise<T | null> {
    try {
      const res = await api.post<T>(url, data);
      return res.data;
    } catch (err) {
      const e = err as AxiosError;
      console.error('❌ API POST error:', e.message);
      return null;
    }
  }


// ➕ Thêm PUT (update)
export async function putData<T = any>(url: string, data: any): Promise<T | null> {
  const res = await api.put<T>(url, data);
  return res.data;
}

  // Export luôn instance nếu cần dùng linh hoạt
  export default api;