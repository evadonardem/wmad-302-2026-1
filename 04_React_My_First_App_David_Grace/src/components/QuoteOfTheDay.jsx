import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, Typography, Stack, Divider, Button, Chip, Box, Select, MenuItem } from '@mui/material';
import { Label, Refresh } from '@mui/icons-material';
import { getRandomQuote, getTags } from '../services/quoteService';

export default function QuoteOfTheDay() {
  // TODO 1 [State Initialization]: Define local state variables for:
  // - 'quote': Stores the current quote object (default: empty object)
  // - 'tags': Stores an array of all available category tags (default: empty array)
  // - 'selectedTag': Tracks the string name of the active filter tag (default: null)
  const [quote,setQuote] = useState({});
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  // TODO 2 [Reference Hook]: Create a React mutable reference named 'selectTagRef' to capture the Select element value
  const selectTagRef = useRef();

  const loadRandomQuote = async () => {
    // TODO 3 [Async Request Handler]: 
    // a. Retrieve the current value from 'selectTagRef' (fallback to empty string if undefined)
    // b. Call 'getRandomQuote(tag)' asynchronously with that tag value
    // c. Update both your 'quote' state and 'selectedTag' state with the returned values
    const currentTag = selectTagRef?.current?.value || '';
    const newRandomQuote = await getRandomQuote(currentTag);
    setQuote(newRandomQuote);
    setSelectedTag(currentTag);
  };

  const loadTags = async () => {
    // TODO 4 [Async List Population]: Fetch tags asynchronously using 'getTags()' and store them into your tags state array
    const availableTags = await getTags();
    setTags(availableTags);
  };

  useEffect(() => {
    // TODO 5 [Component Lifecycle]: Execute both 'loadRandomQuote' and 'loadTags' when the component mounts
    
    (async()=> {
      loadRandomQuote();
      loadTags();
    })();

  }, []);

  return (
    <Card
      variant="elevation"
      elevation={5}
      sx={{
        maxWidth: 500,
        width: '100%',
        borderRadius: 3,
        background: 'linear-gradient(135deg, #a7c8dd 0%, #18566f 100%)',
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Typography variant="overline" color="text.secondary" letterSpacing={2} textAlign="center">
            Quote of the Day
          </Typography>

          <Box>
            {/* TODO 6 [Conditional Chip List]: Map through 'quote.tags'. For each tag 't':
                - Render an MUI <Chip /> with a unique key
                - Apply color="success" if 'selectedTag' matches 't', otherwise color="secondary"
                - Bind label={t} and set custom style margins sx={{ mr: 0.25 }} */}

            {quote.tags?.map(t => (
              <Chip key={t} label={t} color={t === selectedTag ? 'success' : 'secondary'} sx={{ mr: 0.25 }} />
            ))}

          </Box>

          {/* TODO 7 [Text Content Mapping]: Bind 'quote.text' directly inside the quotation marks below */}
          <Typography
            variant="h5"
            component="p"
            fontStyle="italic"
            textAlign="center"
            sx={{ fontWeight: '400', lineHeight: 1.5 }}
          >
            "{quote.text}"
          </Typography>

          {/* TODO 8 [Author Content Mapping]: Bind 'quote.author' after the long dash separator symbol */}
          <Typography variant="subtitle1" textAlign="right" color="text.secondary">
            — {quote.author}
          </Typography>

          <Divider />

          <Stack direction="row" spacing={0.5} justifyContent="space-between" alignItems="center">
            {/* TODO 9 [Controlled Input Integration]: Attach your input reference 'selectTagRef' to this select component */}
            <Select
            inputRef = {selectTagRef}
              fullWidth
              displayEmpty
              size="small"
            >
              <MenuItem value={null}><em>any</em></MenuItem>
              {/* TODO 10 [Select Option Generation]: Map through your 'tags' state array to render a <MenuItem> element for each tag 't' */}
              {tags.map((tag) => <MenuItem key={tag} value={tag}>{tag}</MenuItem>)}
            </Select>

            {/* TODO 11 [Action Trigger Binding]: Attach an interaction listener to trigger 'loadRandomQuote' upon click events */}
            <Button
              fullWidth
              variant="contained"
              startIcon={<Refresh />}
              sx={{ borderRadius: 2, textTransform: 'none' }}
              onClick={loadRandomQuote}
            >
              Next Quote
            </Button>
          </Stack>

        </Stack>
      </CardContent>
    </Card>
  );
}
