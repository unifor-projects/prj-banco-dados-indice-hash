export type ApiError = {
  detail?: string;
};

export type UploadResponse = {
  message: string;
  total_palavras: number;
};

export type PageConfigResponse = {
  message: string;
  page_size: number;
  total_records: number;
  total_pages: number;
};

export type CreatePagesResponse = {
  message: string;
  total_pages: number;
  first_page: { page_id: number; preview_records: string[] };
  last_page: { page_id: number; preview_records: string[] };
};

export type CreateBucketsResponse = {
  message: string;
  total_records: number;
  bucket_capacity_FR: number;
  number_of_buckets_NB: number;
};

export type BuildIndexResponse = {
  message: string;
  total_registros_indexados: number;
  colisoes: number;
  taxa_colisoes_percentual: number;
  buckets_com_overflow: number;
  taxa_overflow_percentual: number;
  tempo_construcao_segundos: number;
};

export type SearchResponse = {
  found: boolean;
  bucket_index: number;
  buckets_visited: number;
  page_id: number | null;
  cost_pages_read: number;
  tempo_busca_segundos: number;
};

export type TableScanResponse = {
  found: boolean;
  page_id: number | null;
  pages_read: number;
  tempo_scan_segundos: number;
  registros_lidos?: string[];
};

export type CompareResponse = {
  index_search: SearchResponse;
  table_scan: TableScanResponse;
  comparacao: {
    diferenca_tempo_segundos: number;
    ganho_percentual_custo: number;
  };
};

function getApiBaseUrl() {
  // No client: NEXT_PUBLIC_API_BASE_URL
  // No server: API_BASE_URL
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    "http://localhost:8000"
  );
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let payload: ApiError | undefined;
    try {
      payload = (await res.json()) as ApiError;
    } catch {
      // ignore
    }

    const message = payload?.detail || `Erro HTTP ${res.status}`;
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export async function uploadTxt(file: File) {
  const form = new FormData();
  form.append("file", file);

  return apiFetch<UploadResponse>("/upload/", {
    method: "POST",
    body: form,
  });
}

export async function setPageSize(pageSize: number) {
  return apiFetch<PageConfigResponse>("/pages/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page_size: pageSize }),
  });
}

export async function createPages() {
  return apiFetch<CreatePagesResponse>("/pages/create", {
    method: "POST",
  });
}

export async function createBuckets() {
  return apiFetch<CreateBucketsResponse>("/index/create-buckets", {
    method: "POST",
  });
}

export async function buildIndex() {
  return apiFetch<BuildIndexResponse>("/index/build", {
    method: "POST",
  });
}

export async function hashKey(key: string) {
  return apiFetch<{ key: string; bucket: number }>(
    `/index/hash/${encodeURIComponent(key)}`,
  );
}

export async function searchKey(key: string) {
  return apiFetch<SearchResponse>(`/index/search/${encodeURIComponent(key)}`);
}

export async function tableScan(key: string) {
  return apiFetch<TableScanResponse>(
    `/index/table-scan/${encodeURIComponent(key)}`,
  );
}

export async function compare(key: string) {
  return apiFetch<CompareResponse>(`/index/compare/${encodeURIComponent(key)}`);
}
