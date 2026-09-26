import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, Typography, Stack, Divider, Button, Chip, Box, Select, MenuItem } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { getRandomQuote, getTags } from '../services/quoteService';

export default function QuoteOfTheDay() {
  // TODO 1 [State Initialization]
  const [quote, setQuote] = useState({});
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  // TODO 2 [Reference Hook]
  const selectTagRef = useRef(null);

  const loadRandomQuote = async () => {
    // TODO 3 [Async Request Handler]
    const tag = selectTagRef.current?.value || '';
    const result = await getRandomQuote(tag);
    setQuote(result);
    setSelectedTag(tag || null);
  };

  const loadTags = async () => {
    // TODO 4 [Async List Population]
    const result = await getTags();
    setTags(result);
  };

  useEffect(() => {
    // TODO 5 [Component Lifecycle]
    loadRandomQuote();
    loadTags();
  }, []);

  return (
    <div className="app-wrapper">
      <Card
        className="quote-card"
        variant="elevation"
        elevation={0}
      >
        <CardContent>
          <Stack spacing={4}>
            <Typography 
              className="section-subtitle"
              variant="overline"
            >
              Quote of the Day
            </Typography>

            <Box sx={{ textAlign: 'center' }}>
              {/* TODO 6 [Conditional Chip List] */}
              {quote.tags?.map((t, i) => (
                <Chip
                  key={i}
                  label={t}
                  className="category-chip"
                  color={selectedTag === t ? 'success' : 'secondary'}
                  variant={selectedTag === t ? 'filled' : 'outlined'}
                />
              ))}
            </Box>

            {/* TODO 7 [Text Content Mapping] */}
            <Typography
              className="quote-text"
              variant="h4"
              component="p"
            >
              "{quote.text}"
            </Typography>

            {/* TODO 8 [Author Content Mapping] */}
            <Typography 
              className="quote-author"
              variant="h6"
            >
              — {quote.author}
            </Typography>

            <Divider className="elegant-divider" />

            <Stack direction="row" spacing={2} alignItems="center">
              {/* TODO 9 [Controlled Input Integration] */}
              <Select
                inputRef={selectTagRef}
                className="category-select"
                fullWidth
                displayEmpty
              >
                <MenuItem value={null}><em>All Categories</em></MenuItem>
                {/* TODO 10 [Select Option Generation] */}
                {tags.map((t, i) => (
                  <MenuItem key={i} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>

              {/* TODO 11 [Action Trigger Binding] */}
              <Button
                onClick={loadRandomQuote}
                className="next-quote-btn"
                variant="contained"
                color="primary"
              >
                Next Quote
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </div>
  );
}