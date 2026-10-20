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
    const tag = selectTagRef.current?.value ?? '';
    const newQuote = await getRandomQuote(tag);

    setQuote(newQuote);
    setSelectedTag(tag || null);
  };

  const loadTags = async () => {
    // TODO 4 [Async List Population]
    const allTags = await getTags();
    setTags(allTags);
  };

  useEffect(() => {
    // TODO 5 [Component Lifecycle]
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
          <Typography
            variant="overline"
            color="text.secondary"
            letterSpacing={2}
            textAlign="center"
          >
            Quote of the Day
          </Typography>

          <Box>
            {/* TODO 6 [Conditional Chip List] */}
            {quote.tags?.map((t) => (
              <Chip
                key={t}
                label={t}
                color={selectedTag === t ? 'success' : 'secondary'}
                sx={{ mr: 0.25 }}
              />
            ))}
          </Box>

          {/* TODO 7 [Text Content Mapping] */}
          <Typography
            variant="h5"
            component="p"
            fontStyle="italic"
            textAlign="center"
            sx={{ fontWeight: '400', lineHeight: 1.5 }}
          >
            “{quote.text ?? ''}”
          </Typography>

          {/* TODO 8 [Author Content Mapping] */}
          <Typography
            variant="subtitle1"
            textAlign="right"
            color="text.secondary"
          >
            — {quote.author ?? ''}
          </Typography>

          <Divider />

          <Stack
            direction="row"
            spacing={0.5}
            justifyContent="space-between"
            alignItems="center"
          >
            {/* TODO 9 [Controlled Input Integration] */}
            <Select
              fullWidth
              displayEmpty
              size="small"
              inputRef={selectTagRef}
              defaultValue={null}
            >
              <MenuItem value={null}>
                <em>any</em>
              </MenuItem>

              {/* TODO 10 [Select Option Generation] */}
              {tags.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>

            {/* TODO 11 [Action Trigger Binding] */}
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