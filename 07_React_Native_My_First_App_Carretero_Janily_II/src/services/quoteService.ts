
import axios from 'axios';

const API_URL =
  'https://motivational-spark-api.vercel.app/api/quotes/random';

export type Quote = {
  text: string;
  author: string;
  tags: string[];
};

const fallbackQuotes: Quote[] = [
  {
    text: 'Keep learning, keep growing, and never stop exploring.',
    author: 'Quote Generator',
    tags: ['motivation'],
  },
  {
    text: 'Great things are done by a series of small things brought together.',
    author: 'Vincent van Gogh',
    tags: ['inspirational', 'success'],
  },
  {
    text: 'It always seems impossible until it is done.',
    author: 'Nelson Mandela',
    tags: ['inspirational', 'wisdom'],
  },
  {
    text: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
    tags: ['success', 'motivation'],
  },
  {
    text: 'Learning never exhausts the mind.',
    author: 'Leonardo da Vinci',
    tags: ['education', 'wisdom'],
  },
  {
    text: 'Believe you can and you are halfway there.',
    author: 'Theodore Roosevelt',
    tags: ['inspirational', 'motivation'],
  },
  {
    text: 'It is never too late to be what you might have been.',
    author: 'George Eliot',
    tags: ['wisdom', 'success'],
  },
  {
    text: 'The beautiful thing about learning is nobody can take it away from you.',
    author: 'B. B. King',
    tags: ['education', 'wisdom'],
  },
  {
    text: 'Success is the sum of small efforts repeated day in and day out.',
    author: 'Robert Collier',
    tags: ['success', 'motivation'],
  },
  {
    text: 'A journey of a thousand miles begins with a single step.',
    author: 'Lao Tzu',
    tags: ['wisdom', 'inspirational'],
  },
];

let lastFallbackIndex = -1;

function getFallbackQuote(
  selectedTag?: string | null
): Quote {
  const matchingQuotes = selectedTag
    ? fallbackQuotes.filter((quote) =>
        quote.tags.some(
          (tag) => tag.toLowerCase() === selectedTag.toLowerCase()
        )
      )
    : fallbackQuotes;

  const availableQuotes =
    matchingQuotes.length > 0 ? matchingQuotes : fallbackQuotes;

  let randomIndex = Math.floor(
    Math.random() * availableQuotes.length
  );

  // Avoid repeating the same fallback quote consecutively
  // whenever at least two choices are available.
  if (
    availableQuotes.length > 1 &&
    availableQuotes === fallbackQuotes &&
    randomIndex === lastFallbackIndex
  ) {
    randomIndex = (randomIndex + 1) % availableQuotes.length;
  }

  if (availableQuotes === fallbackQuotes) {
    lastFallbackIndex = randomIndex;
  }

  return availableQuotes[randomIndex];
}

export async function getRandomQuote(
  selectedTag?: string | null
): Promise<Quote> {
  try {
    const response = await axios.get(API_URL, {
      timeout: 10000,
    });

    const data = Array.isArray(response.data)
      ? response.data[0]
      : response.data;

    const quoteText =
      data?.quote ?? data?.content ?? data?.text;

    if (typeof quoteText !== 'string' || !quoteText.trim()) {
      throw new Error('The API did not return a valid quote.');
    }

    const rawTags = data.tags ?? [];

    const quote: Quote = {
      text: quoteText,
      author:
        typeof data.author === 'string'
          ? data.author
          : 'Unknown',
      tags: Array.isArray(rawTags)
        ? rawTags
            .map((tag: string | { name?: string }) =>
              typeof tag === 'string' ? tag : tag.name ?? ''
            )
            .filter(Boolean)
        : [],
    };

    // If a tag is selected, only accept matching quotes.
    if (
      selectedTag &&
      !quote.tags.some(
        (tag) => tag.toLowerCase() === selectedTag.toLowerCase()
      )
    ) {
      return getFallbackQuote(selectedTag);
    }

    return quote;
  } catch (error) {
    console.warn(
      'Unable to load a quote from the API. Using a local quote instead.',
      error
    );

    return getFallbackQuote(selectedTag);
  }
}

export async function getTags(): Promise<string[]> {
  const localTags = [
    'education',
    'inspirational',
    'motivation',
    'success',
    'wisdom',
  ];

  try {
    const response = await axios.get(
      'https://motivational-spark-api.vercel.app/api/quotes',
      { timeout: 10000 }
    );

    const data = response.data;

    if (!Array.isArray(data)) {
      return localTags;
    }

    const tags = data.flatMap((item: { tags?: unknown }) =>
      Array.isArray(item.tags)
        ? item.tags.filter(
            (tag: unknown): tag is string =>
              typeof tag === 'string'
          )
        : []
    );

    return tags.length > 0
      ? [...new Set(tags)].sort()
      : localTags;
  } catch (error) {
    console.warn(
      'Unable to load quote tags. Using local tags.',
      error
    );

    return localTags;
  }
}
