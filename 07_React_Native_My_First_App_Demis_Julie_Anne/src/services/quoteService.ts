import axios from 'axios';

const API_URL = 'https://quoteslate.vercel.app/api';

export type Quote = {
    text: string;
    author: string;
    tags: string[];
};

export const getRandomQuote = async (selectedTag: string | null = null): Promise<Quote> => {
    // TODO 17: build the endpoint, appending the tag only when one is provided
    const endpoint = selectedTag
        ? `${API_URL}/quotes/random?tags=${encodeURIComponent(selectedTag)}`
        : `${API_URL}/quotes/random`;

    try {
        // TODO 18: GET request, extract fields, return uniform shape
        const response = await axios.get(endpoint);
        const { quote, author, tags } = response.data;

        return { text: quote, author, tags };
    } catch {
        // TODO 19: fallback quote if the request fails
        return {
            text: 'Unable to load a quote right now. Please try again later.',
            author: 'Unknown',
            tags: [],
        };
    }
};

export const getTags = async (): Promise<string[]> => {
    // TODO 20: fetch the list of tags, or return an empty array on failure
    try {
        const response = await axios.get(`${API_URL}/tags`);
        return response.data;
    } catch {
        return [];
    }
};