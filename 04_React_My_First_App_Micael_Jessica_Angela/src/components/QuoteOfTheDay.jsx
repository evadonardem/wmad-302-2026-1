import { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Stack, Divider, Button, Chip, Box, Select, MenuItem } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { getRandomQuote, getTags } from '../services/quoteService';

export default function QuoteOfTheDay() {

  const [quote, setQuote] = useState({});
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');

  const loadRandomQuote = async () => {
    
    const newRandomQuote = await getRandomQuote(selectedTag);
    setQuote(newRandomQuote);
  };

  useEffect(() => {
    
    let isMounted = true;

    const loadInitialData = async () => {
      const [initialQuote, availableTags] = await Promise.all([
        getRandomQuote(),
        getTags(),
      ]);

      if (isMounted) {
        setQuote(initialQuote);
        setTags(availableTags);
        setSelectedTag('');
      }
    };

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <Card
      variant="elevation"
      elevation={5}
      sx={{
        maxWidth: 500,
        width: '100%',
        borderRadius: 3,
        bgcolor: 'background.paper',
        color: 'text.primary',
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Typography variant="overline" color="text.secondary" letterSpacing={2} textAlign="center">
            Quote of the Day
          </Typography>

          <Box>
            {tags.map(t => (
              <Chip
                key={t}
                label={t}
                sx={{
                  mr: 0.25,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              />
            ))}
          </Box>

          <Typography
            variant="h5"
            component="p"
            fontStyle="italic"
            textAlign="center"
            color="text.primary"
            sx={{ fontWeight: '400', lineHeight: 1.5 }}
          >
            "{quote.text}"
          </Typography>

          <Typography variant="subtitle1" textAlign="right" color="text.secondary">
            — {quote.author}
          </Typography>

          <Divider />

          <Stack direction="row" spacing={0.5} justifyContent="space-between" alignItems="center">
          
            <Select
              fullWidth
              displayEmpty
              size="small"
              value={selectedTag}
              onChange={(event) => setSelectedTag(event.target.value)}
            >
              <MenuItem value=""><em>any</em></MenuItem>
              
              {tags.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
            
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