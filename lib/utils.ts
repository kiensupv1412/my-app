import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeSlug(text: string) {
  let slug = text.toLowerCase();
  slug = slug.replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a');
  slug = slug.replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e');
  slug = slug.replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i');
  slug = slug.replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o');
  slug = slug.replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u');
  slug = slug.replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y');
  slug = slug.replace(/đ/gi, 'd');
  slug = slug.replace(/\`|\~|\!|\@|\#|\||\$|\%|\^|\&|\*|\(|\)|\+|\=|\,|\.|\/|\?|\>|\<|\'|\"|\:|\;|_/gi, '');
  slug = slug.replace(/ /gi, "-");
  slug = slug.replace(/\-\-\-\-\-/gi, '-');
  slug = slug.replace(/\-\-\-\-/gi, '-');
  slug = slug.replace(/\-\-\-/gi, '-');
  slug = slug.replace(/\-\-/gi, '-');
  slug = '@' + slug + '@';
  slug = slug.replace(/\@\-|\-\@|\@/gi, '');
  return slug;
}

export function safeStringify(value: any): string | null {
  try { return JSON.stringify(value ?? null); } catch { return null; }
}

export function createFormData(data?: Record<string, any>) {
  const fd = new FormData();
  if (data) appendFormData(fd, data);
  return fd;
}

function isFileLike(v: any): v is File | Blob {
  if (!v) return false;
  const CFile = typeof File !== 'undefined' ? File : undefined;
  const CBlob = typeof Blob !== 'undefined' ? Blob : undefined;
  return (CFile && v instanceof CFile) || (CBlob && v instanceof CBlob);
}

export function appendFormData(formData: FormData, data: Record<string, any>, prefix = ''): FormData {
  if (!data || typeof data !== 'object') return formData;

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;

    const formKey = prefix ? `${prefix}[${key}]` : key;

    if (isFileLike(value)) {
      formData.append(formKey, value as any);
    } else if (value instanceof Date) {
      formData.append(formKey, value.toISOString());
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => appendFormData(formData, { [i]: v }, formKey));
    } else if (typeof value === 'object') {
      appendFormData(formData, value, formKey);
    } else {
      formData.append(formKey, String(value));
    }
  }
  return formData;
}
