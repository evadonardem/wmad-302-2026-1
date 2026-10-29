import axios from 'axios';

// NOTE: this must be the full base URL of the quotes API (e.g. https://<your-app>.vercel.app).
const API_URL = 'https://quoteslate.vercel.app/api';

export type Quote = {
    text: string;
    author: string;
    tags: string[];
};

export const getRandomQuote = async (selectedTag: string | null = null): Promise<Quote> => {
    // TODO 17: build the endpoint, appending ?tags=<tag> only when a tag is selected.
    const endpoint = selectedTag
        ? `${API_URL}/quotes/random?tags=${encodeURIComponent(selectedTag)}`
        : `${API_URL}/quotes/random`;

    try {
        // TODO 18: async GET with Axios, then map the payload to { text, author, tags }.
        const response = await axios.get(endpoint);
        const { quote, author, tags } = response.data ?? {};
        if (typeof quote !== 'string') {
            // The API answered, but not with a quote (e.g. wrong base URL returning HTML).
            throw new Error('Unexpected API response');
        }
        return { text: quote, author: author ?? 'Unknown', tags: tags ?? [] };
    } catch {
        // TODO 19: fallback quote when the network/API call fails.
        return {
            text: 'Unable to load a quote right now. Please check your connection and try again.',
            author: 'System',
            tags: [],
        };
    }
};

export const getTags = async (): Promise<string[]> => {
    // TODO 20: fetch the category list, or return an empty array on failure.
    try {
        const response = await axios.get(`${API_URL}/tags`);
        return Array.isArray(response.data) ? response.data : [];
    } catch {
        return [];
    }
};