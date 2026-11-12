import axios from 'axios';

const BASE_URL = 'https://api.quotable.io'; // or fallback API endpoint

export interface Quote {
  _id: string;
  content: string;
  author: string;
  tags: string[];
}

export interface Tag {
  _id: string;
  name: string;
}

// TODO 17 & 18: Fetch Random Quote (with optional category filter tag)
export const fetchRandomQuote = async (tag?: string): Promise<Quote> => {
  try {
    const url = tag ? `${BASE_URL}/random?tags=${tag}` : `${BASE_URL}/random`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching quote, returning fallback:', error);
    // Fallback shield object in case network request fails
    return {
      _id: 'fallback-1',
      content: 'The secret of getting ahead is getting started.',
      author: 'Mark Twain',
      tags: ['Motivation'],
    };
  }
};

// TODO 19 & 20: Fetch Quote Categories / Tags List
export const fetchQuoteTags = async (): Promise<Tag[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/tags`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tags, returning fallback:', error);
    return [
      { _id: '1', name: 'famous-quotes' },
      { _id: '2', name: 'inspirational' },
      { _id: '3', name: 'wisdom' },
    ];
  }
};