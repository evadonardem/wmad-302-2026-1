import axios from 'axios';

const API_URL = 'https://quoteslate.vercel.app/api';

export type Quote = {
    text: string;
    author: string;
    tags: string[];
};

const fallbackQuotes: Quote[] = [
    {
        text: 'The secret of getting ahead is getting started.',
        author: 'Mark Twain',
        tags: ['inspiration', 'success'],
    },
    {
        text: 'It always seems impossible until it is done.',
        author: 'Nelson Mandela',
        tags: ['inspiration', 'life'],
    },
    {
        text: 'Great things are done by a series of small things brought together.',
        author: 'Vincent van Gogh',
        tags: ['success', 'life'],
    },
    {
        text: 'Believe you can and you are halfway there.',
        author: 'Theodore Roosevelt',
        tags: ['inspiration', 'success'],
    },
    {
        text: 'Knowing yourself is the beginning of all wisdom.',
        author: 'Aristotle',
        tags: ['wisdom', 'life'],
    },
    {
        text: 'The purpose of our lives is to be happy.',
        author: 'Dalai Lama',
        tags: ['life', 'inspiration'],
    },
    {
        text: 'The only true wisdom is in knowing you know nothing.',
        author: 'Socrates',
        tags: ['wisdom'],
    },
];

const getFallbackQuote = (selectedTag: string | null): Quote => {
    const matchingQuotes = selectedTag
        ? fallbackQuotes.filter((quote) =>
              quote.tags.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase()),
          )
        : fallbackQuotes;
    const quotes = matchingQuotes.length > 0 ? matchingQuotes : fallbackQuotes;

    return quotes[Math.floor(Math.random() * quotes.length)];
};

const normalizeTags = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map((tag) => {
            if (typeof tag === 'string') return tag;
            if (typeof tag === 'object' && tag !== null && 'slug' in tag && typeof tag.slug === 'string') {
                return tag.slug;
            }
            if (typeof tag === 'object' && tag !== null && 'name' in tag && typeof tag.name === 'string') {
                return tag.name;
            }
            return null;
        })
        .filter((tag): tag is string => tag !== null);
};

export const getRandomQuote = async (selectedTag: string | null = null): Promise<Quote> => {
    const endpoint = `${API_URL}/quotes/random${
        selectedTag ? `?tags=${encodeURIComponent(selectedTag)}` : ''
    }`;

    try {
        const response = await axios.get<unknown>(endpoint);
        const payload = Array.isArray(response.data) ? response.data[0] : response.data;
        if (typeof payload !== 'object' || payload === null) {
            throw new Error('Quote API returned an invalid response.');
        }

        const data = payload as Record<string, unknown>;
        const text = data.quote ?? data.text ?? data.content;
        if (typeof text !== 'string' || typeof data.author !== 'string') {
            throw new Error('Quote API response is missing quote text or author.');
        }

        return {
            text,
            author: data.author,
            tags: normalizeTags(data.tags),
        };
    } catch (error) {
        console.warn('Could not load a quote from Quoteslate; trying the live tagged quote API.', error);

        try {
            const availableTags = [...new Set(fallbackQuotes.flatMap(({ tags }) => tags))];
            const tag =
                selectedTag ??
                availableTags[Math.floor(Math.random() * availableTags.length)];
            const response = await axios.get<Array<{ q: string; a: string }>>(
                `https://zenquotes.io/api/random/${encodeURIComponent(tag)}`,
            );
            const result = response.data[0];
            if (!result || typeof result.q !== 'string' || typeof result.a !== 'string') {
                throw new Error('Tagged quote API returned an invalid response.');
            }
            if (/too many requests|unauthorized api request/i.test(result.q)) {
                throw new Error(result.q);
            }

            return {
                text: result.q,
                author: result.a,
                tags: [tag],
            };
        } catch (backupError) {
            console.warn('Could not load a tagged quote from the backup API; using a local quote instead.', backupError);
            return getFallbackQuote(selectedTag);
        }
    }
};

export const getTags = async (): Promise<string[]> => {
    try {
        const response = await axios.get<unknown>(`${API_URL}/tags`);
        const tags = normalizeTags(response.data);
        return tags.length > 0 ? tags : [...new Set(fallbackQuotes.flatMap(({ tags: quoteTags }) => quoteTags))];
    } catch (error) {
        console.warn('Could not load quote tags; using local tags instead.', error);
        return [...new Set(fallbackQuotes.flatMap(({ tags }) => tags))];
    }
};
