import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, Typography, Stack, Divider, Button, Chip, Box, Select, MenuItem } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { getRandomQuote, getTags } from '../services/quoteService';

export default function QuoteOfTheDay() {
  // TODO 1 [State Initialization]: Define local state variables
  const [quote, setQuote] = useState({});
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  // TODO 2 [Reference Hook]: Create a React mutable reference named 'selectTagRef'
  const selectTagRef = useRef(null);

  const loadRandomQuote = async () => {
    // TODO 3 [Async Request Handler]: 
    const tag = selectTagRef.current?.value || '';
    const data = await getRandomQuote(tag);
    setQuote(data || {});
    setSelectedTag(tag || null);
  };

  const loadTags = async () => {
    // TODO 4 [Async List Population]: Fetch tags asynchronously
    const fetchedTags = await getTags();
    setTags(fetchedTags || []);
  };

  useEffect(() => {
    // TODO 5 [Component Lifecycle]: Execute both on mount
    loadRandomQuote();
    loadTags();
  }, []);

  return (
    <Card
      variant="elevation"
      elevation={5}
      sx={{
        maxWidth: 500,
        width: '100%',
        borderRadius: 3
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Typography variant="overline" color="text.secondary" letterSpacing={2} textAlign="center">
            Quote of the Day
          </Typography>

          <Box textAlign="center">
            {/* TODO 6 [Conditional Chip List]: Map through 'quote.tags' */}
            {quote.tags && quote.tags.map((t) => (
              <Chip
                key={t}
                label={t}
                color={selectedTag === t ? 'success' : 'secondary'}
                sx={{ mr: 0.25, mb: 0.5 }}
              />
            ))}
          </Box>

          {/* TODO 7 [Text Content Mapping]: Bind 'quote.text' */}
          <Typography
            variant="h5"
            component="p"
            fontStyle="italic"
            textAlign="center"
            sx={{ fontWeight: '400', lineHeight: 1.5 }}
          >
            "{quote.text || ''}"
          </Typography>

          {/* TODO 8 [Author Content Mapping]: Bind 'quote.author' */}
          <Typography variant="subtitle1" textAlign="right" color="text.secondary">
            — {quote.author || 'Unknown'}
          </Typography>

          <Divider />

          <Stack direction="row" spacing={0.5} justifyContent="space-between" alignItems="center">
            {/* TODO 9 [Controlled Input Integration]: Attach 'selectTagRef' */}
            <Select
              fullWidth
              displayEmpty
              size="small"
              inputRef={selectTagRef}
              defaultValue=""
            >
              <MenuItem value=""><em>any</em></MenuItem>
              {/* TODO 10 [Select Option Generation]: Map through 'tags' */}
              {tags.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
            
            {/* TODO 11 [Action Trigger Binding]: Attach onClick to trigger loadRandomQuote */}
            <Button
              fullWidth
              variant="contained"
              startIcon={<Refresh />}
              onClick={loadRandomQuote}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Next Quote
            </Button>
          </Stack>

        </Stack>
      </CardContent>
    </Card>
  );
}