import axios from 'axios';

const API_URL = 'https://quoteslate.vercel.app/api';

export type Quote = {
    text: string;
    author: string;
    tags: string[];
};

export const getRandomQuote = async (selectedTag: string | null = null): Promise<Quote> => {
    const endpoint = selectedTag
        ? `${API_URL}/quotes/random?tags=${encodeURIComponent(selectedTag)}`
        : `${API_URL}/quotes/random`;

    try {
        const response = await axios.get(endpoint);
        const data = Array.isArray(response.data) ? response.data[0] : response.data;
        const { quote, author, tags } = data;

        return { text: quote, author, tags: tags ?? [] };
    } catch (error) {
        console.log('Quote fetch failed:', error);
        return {
            text: 'Unable to load a quote right now. Please try again later.',
            author: 'Unknown',
            tags: [],
        };
    }
};

export const getTags = async (): Promise<string[]> => {
    try {
        const response = await axios.get(`${API_URL}/tags`);
        return response.data;
    } catch (error) {
        console.log('Tags fetch failed:', error);
        return [];
    }
};