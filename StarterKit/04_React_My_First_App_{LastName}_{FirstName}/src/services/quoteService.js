import axios from 'axios';

const API_URL = 'https://vercel.app';

export const getRandomQuote = async (selectedTag = null) => {
    const endpoint = selectedTag
        ? `${API_URL}/quotes/random?tags=${encodeURIComponent(selectedTag)}`
        : `${API_URL}/quotes/random`;

    try {
        const { data } = await axios.get(endpoint);
        const { quote, author, tags } = data;

        return {
            text: quote,
            author,
            tags,
        };
    } catch {
        return {
            text: 'The best way to predict the future is to create it.',
            author: 'Unknown',
            tags: ['inspiration'],
        };
    }
};

export const getTags = async () => {
    try {
        const { data } = await axios.get(`${API_URL}/tags`);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}
