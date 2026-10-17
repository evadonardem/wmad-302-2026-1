import axios from 'axios';

const API_URL = 'https://quoteslate.vercel.app/api';

export const getRandomQuote = async (selectedTag = null) => {
    // TODO 17 [Dynamic Endpoint Interpolation]
    const endpoint = `${API_URL}/quotes/random${selectedTag ? `?tags=${encodeURIComponent(selectedTag)}` : ''}`;

    try {
        // TODO 18 [Asynchronous Request Handling]
        const response = await axios.get(endpoint);
        const { quote: text, author, tags } = response.data;

        return {
            text,
            author,
            tags,
        };

    } catch {
        // TODO 19 [Resilient System Fallbacks]
        return {
            text: 'Unable to load a quote right now.',
            author: 'Please try again later',
            tags: [],
        };
    }
};

export const getTags = async () => {
    // TODO 20 [Asynchronous List Retrieval]
    try {
        const response = await axios.get(`${API_URL}/tags`);
        return response.data;
    } catch {
        return [];
    }
};