const SEARCH_711_STORES_URL =
  'https://asia-east1-meatweb-ff8d6.cloudfunctions.net/search711Stores';

export type Search711StoresParams = {
  city: string;
  town: string;
  keyword?: string;
};

export type Search711StoresResponse = {
  ok: boolean;
  items?: Array<{ id?: string; name?: string; address?: string }>;
  count?: number;
};

export const search711Stores = async (
  { city, town, keyword }: Search711StoresParams,
  signal?: AbortSignal,
): Promise<Search711StoresResponse> => {
  const query = new URLSearchParams({
    city,
    town,
    ...(keyword ? { keyword } : {}),
  });
  const response = await fetch(`${SEARCH_711_STORES_URL}?${query.toString()}`, { signal });
  if (!response.ok) {
    throw new Error('無法取得門市清單');
  }
  return (await response.json()) as Search711StoresResponse;
};