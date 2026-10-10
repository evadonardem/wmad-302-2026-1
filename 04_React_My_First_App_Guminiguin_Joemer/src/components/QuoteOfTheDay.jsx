import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, Typography, Stack, Divider, Button, Chip, Box, Select, MenuItem } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { getRandomQuote, getTags } from '../services/quoteService';

export default function QuoteOfTheDay() {
  const [quote, setQuote] = useState({});
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);

  const selectTagRef = useRef(null);

  const loadRandomQuote = async () => {
    const tag = selectTagRef.current?.value || '';
    const result = await getRandomQuote(tag);
    setQuote(result || {});
    setSelectedTag(tag || null);
  };

  const loadTags = async () => {
    const result = await getTags();
    setTags(result || []);
  };

  useEffect(() => {
    loadRandomQuote();
    loadTags();
  }, []);

  return (
    <Card
      elevation={4}
      sx={{
        maxWidth: 550,
        width: '90%',
        borderRadius: 4,
        p: 2,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)'
      }}
    >
      <CardContent>
        <Stack spacing={3}>
          <Typography 
            variant="overline" 
            textAlign="center" 
            color="text.secondary" 
            letterSpacing={2}
            fontWeight="bold"
          >
            Quote of the Day
          </Typography>

          <Box sx={{ textAlign: 'center' }}>
            {quote.tags?.map((t, i) => (
              <Chip
                key={i}
                label={t}
                color={selectedTag === t ? 'success' : 'secondary'}
                variant={selectedTag === t ? 'filled' : 'outlined'}
                size="small"
                sx={{ mr: 0.5, mb: 0.5, fontWeight: 500 }}
              />
            ))}
          </Box>

          <Typography
            variant="h5"
            component="p"
            textAlign="center"
            fontStyle="italic"
            sx={{ fontWeight: '400', lineHeight: 1.6 }}
          >
            "{quote.text || ''}"
          </Typography>

          <Typography 
            variant="subtitle1" 
            textAlign="right" 
            color="text.secondary"
            sx={{ fontWeight: 600 }}
          >
            — {quote.author || 'Unknown'}
          </Typography>

          <Divider />

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Select
              inputRef={selectTagRef}
              fullWidth
              size="small"
              displayEmpty
              defaultValue=""
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value=""><em>All Categories</em></MenuItem>
              {tags.map((t, i) => (
                <MenuItem key={i} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>

            <Button
              onClick={loadRandomQuote}
              variant="contained"
              color="primary"
              startIcon={<Refresh />}
              sx={{ 
                borderRadius: 2, 
                px: 3, 
                whiteSpace: 'nowrap',
                textTransform: 'none',
                fontWeight: 'bold'
              }}
            >
              Next Quote
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}