import axios from 'axios';

const API_URL = 'https://quoteslate.vercel.app/api';

const fallbackQuotes = [
    { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain', tags: ['inspiration', 'success'] },
    { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela', tags: ['inspiration', 'life'] },
    { text: 'Great things are done by a series of small things brought together.', author: 'Vincent van Gogh', tags: ['success', 'life'] },
    { text: 'Believe you can and you are halfway there.', author: 'Theodore Roosevelt', tags: ['inspiration', 'success'] },
    { text: 'Knowing yourself is the beginning of all wisdom.', author: 'Aristotle', tags: ['wisdom', 'life'] },
    { text: 'The purpose of our lives is to be happy.', author: 'Dalai Lama', tags: ['life', 'inspiration'] },
    { text: 'The only true wisdom is in knowing you know nothing.', author: 'Socrates', tags: ['wisdom'] },
];

const getFallbackQuote = (selectedTag) => {
    const matchingQuotes = selectedTag
        ? fallbackQuotes.filter(({ tags }) => tags.includes(selectedTag))
        : fallbackQuotes;
    const quotes = matchingQuotes.length > 0 ? matchingQuotes : fallbackQuotes;
    return quotes[Math.floor(Math.random() * quotes.length)];
};

export const getRandomQuote = async (selectedTag = null) => {
    const queryParams = selectedTag ? `?tags=${encodeURIComponent(selectedTag)}` : ``;
    const endpoint = `${API_URL}/quotes/random${queryParams}`;

    try {
        const response = await axios.get(endpoint);
        const { quote: text, author, tags } = response.data;

        return {
            text, 
            author, 
            tags,
        };

    } catch (error) {
        console.warn('Could not load a quote from the quote service; using a local quote instead.', error);
        return getFallbackQuote(selectedTag);
    }
};

export const getTags = async () => {
    try {
        const response = await axios.get(`${API_URL}/tags`);
        return response.data;
    } catch (error) {
        console.warn('Could not load quote categories; using local categories instead.', error);
        return [...new Set(fallbackQuotes.flatMap(({ tags }) => tags))];
    }
};