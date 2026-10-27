import axios from 'axios';

const API_URL = 'https://quoteslate.vercel.app/api';

export type Quote = {
    text: string;
    author: string;
    tags: string[];
};

const FALLBACK_QUOTES: Quote[] = [
    {
        text: 'The future depends on what you do today.',
        author: 'Mahatma Gandhi',
        tags: ['inspiration', 'life'],
    },
    {
        text: 'It always seems impossible until it is done.',
        author: 'Nelson Mandela',
        tags: ['inspiration', 'motivation'],
    },
    {
        text: 'What you think, you become. What you feel, you attract. What you imagine, you create.',
        author: 'Buddha',
        tags: ['wisdom', 'life'],
    },
    {
        text: 'Great things are done by a series of small things brought together.',
        author: 'Vincent van Gogh',
        tags: ['motivation', 'success'],
    },
];

const FALLBACK_TAGS = [...new Set(FALLBACK_QUOTES.flatMap((quote) => quote.tags))];

export const getRandomQuote = async (selectedTag: string | null = null) => {
    const endpoint = `${API_URL}/quotes/random${selectedTag ? `?tags=${encodeURIComponent(selectedTag)}` : ''}`;

    try {
        const response = await axios.get<{
            quote: string;
            author: string;
            tags: string[];
        }>(endpoint, { timeout: 10000 });
        const { quote, author, tags } = response.data;

        return { text: quote, author, tags };
    } catch {
        const matchingQuotes = selectedTag
            ? FALLBACK_QUOTES.filter((quote) => quote.tags.includes(selectedTag))
            : FALLBACK_QUOTES;
        const quotes = matchingQuotes.length > 0 ? matchingQuotes : FALLBACK_QUOTES;
        return quotes[Math.floor(Math.random() * quotes.length)];
    }
};

export const getTags = async () => {
    try {
        const response = await axios.get<string[]>(`${API_URL}/tags`, { timeout: 10000 });
        return response.data;
    } catch {
        return FALLBACK_TAGS;
    }
};
