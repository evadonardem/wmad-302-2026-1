import axios from 'axios';

const API_URL = 'https://quoteslate.vercel.app/api';

export type Quote = {
    text: string;
    author: string;
    tags: string[];
};

export const getRandomQuote = async (selectedTag: string | null = null) => {
    const endpoint = selectedTag
        ? `${API_URL}/quotes/random?tags=${encodeURIComponent(selectedTag)}`
        : `${API_URL}/quotes/random`;

    try {
        const { data } = await axios.get(endpoint);
        const { quote, author, tags } = data;
        return { text: quote, author, tags };

    } catch {
        return {
            text: 'The best way out is always through.',
            author: 'Unknown',
            tags: [],
        };
    }
};

export const getTags = async () => {
    try {
        const { data } = await axios.get(`${API_URL}/tags`);
        return data;
    } catch {
        return [];
    }
};
