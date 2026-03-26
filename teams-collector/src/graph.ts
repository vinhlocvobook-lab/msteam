import axios, { AxiosInstance } from 'axios';

const BASE_URL = 'https://graph.microsoft.com/v1.0';

export function createGraphClient(token: string): AxiosInstance {
    const client = axios.create({
        baseURL: BASE_URL,
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
    });

    // Log lỗi API rõ ràng
    client.interceptors.response.use(
        res => res,
        err => {
            const status = err.response?.status;
            const message = err.response?.data?.error?.message;
            console.error(`❌ Graph API error ${status}: ${message}`);
            return Promise.reject(err);
        }
    );

    return client;
}

// Tự động xử lý phân trang (nextLink)
export async function fetchAllPages<T>(
    client: AxiosInstance,
    url: string
): Promise<T[]> {
    const results: T[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
        const fullUrl: string = nextUrl.startsWith('http')
            ? nextUrl
            : `${BASE_URL}${nextUrl}`;
        const response = await client.get<{ value: T[]; '@odata.nextLink'?: string }>(fullUrl);
        results.push(...(response.data.value || []));
        nextUrl = response.data['@odata.nextLink'] || null;
        if (nextUrl) await sleep(300);
    }

    return results;
}


export const sleep = (ms: number) =>
    new Promise(r => setTimeout(r, ms));