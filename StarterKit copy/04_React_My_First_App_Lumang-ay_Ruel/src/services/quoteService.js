import axios from 'axios';

const API_URL = 'https://api.quotable.io';
const FALLBACK_QUOTES = [
    {
        text: 'The next useful step is often smaller than you think.',
        author: 'Unknown',
        tags: ['inspiration'],
    },
    {
        text: 'A little progress, repeated, becomes a long way forward.',
        author: 'Unknown',
        tags: ['inspiration'],
    },
    {
        text: 'Stay curious; good questions open unexpected doors.',
        author: 'Unknown',
        tags: ['inspiration'],
    },
];
let fallbackQuoteIndex = -1;

export const getRandomQuote = async (selectedTag = null) => {
    const endpoint = selectedTag
        ? `${API_URL}/quotes/random?tags=${encodeURIComponent(selectedTag)}`
        : `${API_URL}/quotes/random`;

    try {
        const { data } = await axios.get(endpoint, { timeout: 5000 });
        const { content, author, tags } = data;

        return {
            text: content,
            author,
            tags,
        };
    } catch {
        fallbackQuoteIndex = (fallbackQuoteIndex + 1) % FALLBACK_QUOTES.length;
        return FALLBACK_QUOTES[fallbackQuoteIndex];
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
