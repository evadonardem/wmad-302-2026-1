import axios from 'axios';

const API_URL = 'https://quoteslate.vercel.app/api';

export type Quote = {
  text: string;
  author: string;
  tags: string[];
};

export const getRandomQuote = async (selectedTag: string | null = null): Promise<Quote> => {
  // TODO 17 [Dynamic Endpoint Interpolation]: Formulate the dynamic target endpoint string URL.
  // If a truthy 'selectedTag' value is provided, append '?tags=[selectedTag]' to the base random path URL.
  // Example Target: 'https://vercel.app/quotes/random?tags=wisdom'
  const endpoint = selectedTag
    ? `${API_URL}/quotes/random?tags=${selectedTag}`
    : `${API_URL}/quotes/random`;

  try {
    // TODO 18 [Asynchronous Request Handling]:
    // a. Execute an asynchronous GET network request using Axios targeting your calculated endpoint URL.
    // b. Extract the 'quote', 'author', and 'tags' properties from the resulting payload object.
    // c. Return a clean object structured with uniform mapping matching: { text: [extracted quote text], author, tags }
    const response = await axios.get(endpoint);
    const data = Array.isArray(response.data) ? response.data[0] : response.data;
    const { quote, author, tags } = data;
    return { text: quote, author, tags: tags ?? [] };
  } catch {
    // TODO 19 [Resilient System Fallbacks]: Return a hardcoded fallback quote object
    // with custom placeholder messages if an unexpected API or network timeout exception is encountered.
    return {
      text: 'Unable to load a quote right now. Please check your connection and try again.',
      author: 'System',
      tags: [],
    };
  }
};

export const getTags = async (): Promise<string[]> => {
  // TODO 20 [Asynchronous List Retrieval]:
  // Fetch global category strings from the API endpoint path
  // `${API_URL}/tags` using Axios.
  // Return the response data array on success, or return an empty array fallback inside the catch safety layer.
  try {
    const response = await axios.get(`${API_URL}/tags`);
    const list: (string | { name?: string })[] = Array.isArray(response.data)
      ? response.data
      : response.data?.tags ?? [];
    return list.map((t) => (typeof t === 'string' ? t : t.name ?? ''));
  } catch {
    return [];
  }
};