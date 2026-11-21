import axios from 'axios';

const API_URL = 'https://vercel.app';

export type Quote = {
    text: string;
    author: string;
    tags: string[];
};

export const getRandomQuote = async (selectedTag: string | null = null) => {
    const endpoint = `${API_URL}/quotes/random${selectedTag ? `?tags=${encodeURIComponent(selectedTag)}` : ''}`;

    try {
        const { data } = await axios.get<{ quote: string; author: string; tags: string[] }>(endpoint);
        return { text: data.quote, author: data.author, tags: data.tags };
    } catch (error) {
        console.error('Failed to fetch a random quote:', error);
        return {
            text: 'Unable to load a quote right now. Please try again.',
            author: 'Quote Generator',
            tags: [],
        };
    }
};

export const getTags = async () => {
    try {
        const { data } = await axios.get<string[]>(`${API_URL}/tags`);
        return data;
    } catch (error) {
        console.error('Failed to fetch quote tags:', error);
        return [];
    }
};
