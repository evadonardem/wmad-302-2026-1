import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, Typography, Stack, Divider, Button, Chip, Box, 
  Select, MenuItem, useTheme, IconButton, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText
} from '@mui/material';
import { Refresh, Favorite, FavoriteBorder,Delete ,Bookmark,BookmarkBorder} from '@mui/icons-material'; // NEW: added Favorite, FavoriteBorder
import { getRandomQuote, getTags } from '../services/quoteService';

export default function QuoteOfTheDay() {
  // TODO 1 [State Initialization]: Define local state variables for:
  // - 'quote': Stores the current quote object (default: empty object)
  // - 'tags': Stores an array of all available category tags (default: empty array)
  // - 'selectedTag': Tracks the string name of the active filter tag (default: null)
  const [quote, setQuote] = useState({});
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [bgColor, setBgColor] = useState('#ffffff'); // newly added, State variable for background color
  const [likedQuotes, setLikedQuotes] = useState(() => {
    const saved = localStorage.getItem('likedQuotes');
    return saved ? JSON.parse(saved) : [];
  });
  const [showLiked, setShowLiked] = useState(false);// newly added, State variable to toggle liked quotes view
  // TODO 2 [Reference Hook]: Create a React mutable reference named 'selectTagRef' to capture the Select element value
  
  const selectTagRef = useRef();
  const theme = useTheme();   // <-- NEW: gives access to the current theme

  // Two palettes — used depending on the current mode
  const darkColors = ['#020266', '#1e3470', '#03326c', '#461d85', '#7a0f68', '#3c0481'];
  const lightColors = ['#f8c0c0', '#fbe8b4', '#a8f6af', '#b1dbfa', '#f7acc5', '#fad8a2'];

  const textColor = theme.palette.mode === 'light' ? '#ffffff' : '#000000';   // <-- NEW

  const isLiked = likedQuotes.some(q => q.text === quote.text && q.author === quote.author); // NEW: was missing entirely

  const toggleLike = () => {
    let updated;
    if (isLiked) {
      updated = likedQuotes.filter(q => !(q.text === quote.text && q.author === quote.author));
    } else {
      updated = [...likedQuotes, quote];
    }
    setLikedQuotes(updated);
    localStorage.setItem('likedQuotes', JSON.stringify(updated));
  };// newly added, Function to toggle like/unlike for the current quote
  
  const removeLikedQuote = (index) => { // NEW: removes a quote from the liked list by index
    const updated = likedQuotes.filter((_, i) => i !== index);
    setLikedQuotes(updated);
    localStorage.setItem('likedQuotes', JSON.stringify(updated));
  };

  const loadRandomQuote = async () => {
    // TODO 3 [Async Request Handler]: 
    // a. Retrieve the current value from 'selectTagRef' (fallback to empty string if undefined)
    // b. Call 'getRandomQuote(tag)' asynchronously with that tag value
    // c. Update both your 'quote' state and 'selectedTag' state with the returned values
    const currentTag = selectTagRef.current?.value;
    const newRandomQuote = await getRandomQuote(currentTag);
    console.log('API returned:', newRandomQuote);
    setQuote(newRandomQuote);
    setSelectedTag(currentTag);

    const palette = theme.palette.mode === 'light' ? darkColors : lightColors;
    setBgColor(palette[Math.floor(Math.random() * palette.length)]);
  };

  const loadTags = async () => {
    // TODO 4 [Async List Population]: Fetch tags asynchronously using 'getTags()' and store them into your tags state array
    
    const newTags = await getTags();
    setTags(newTags);
  };

  useEffect(() => {
    // TODO 5 [Component Lifecycle]: Execute both 'loadRandomQuote' and 'loadTags' when the component mounts
  
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
        borderRadius: 3,
        backgroundColor: bgColor, // newly added,Use the state variable for background color
        transition: 'background-color 0.4s ease', // newly added, Smooth transition for background color change
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Typography variant="overline" color="text.secondary" sx = {{letterSpacing:2 ,textAlign:"center", color: textColor}}>
            Quote of the Day
          </Typography>

          <Box>
            {/* TODO 6 [Conditional Chip List]: Map through 'quote.tags'. For each tag 't':
                - Render an MUI <Chip /> with a unique key
                - Apply color="success" if 'selectedTag' matches 't', otherwise color="secondary"
                - Bind label={t} and set custom style margins sx={{ mr: 0.25 }} */}
            {quote.tags?.map(t=><Chip key={t} label={t} color={selectedTag === t ? "success" : "secondary"} sx={{ mr: 0.25 }} />)}
          </Box>

          {/* TODO 7 [Text Content Mapping]: Bind 'quote.text' directly inside the quotation marks below */}
          <Typography
            variant="h5"
            component="p"
            fontStyle="italic"
            
            sx={{ textAlign:'center', fontWeight: '400', lineHeight: 1.5 ,color: textColor}}
          >
            "{quote.text}"
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <IconButton onClick={toggleLike} sx={{ color: textColor }}>
              {isLiked ? <Favorite color="error" /> : <FavoriteBorder />}
            </IconButton>
            <IconButton onClick= {()=> setShowLiked(true)} sx={{ color: textColor }}> 
              {likedQuotes.length > 0 ? <Bookmark /> : <BookmarkBorder />}
            </IconButton> 
               {/* TODO 8 [Author Content Mapping]: Bind 'quote.author' after the long dash separator symbol */}
            <Typography variant="subtitle1" color="text.secondary" sx={{ textAlign: 'right', color: textColor }}>
                — {quote.author}
            </Typography>
          </Stack>

          <Divider />

          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            {/* TODO 9 [Controlled Input Integration]: Attach your input reference 'selectTagRef' to this select component */}
            <Select
              inputRef={selectTagRef}
              fullWidth
              displayEmpty
              size="small"
              sx={{
                color: textColor,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: textColor,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: textColor,
                },
                '& .MuiSvgIcon-root': {
                  color: textColor,
                },
              }}
            >
              <MenuItem value=""><em>any</em></MenuItem>
              {/* TODO 10 [Select Option Generation]: Map through your 'tags' state array to render a <MenuItem> element for each tag 't' */}
              {tags.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
            
            {/* TODO 11 [Action Trigger Binding]: Attach an interaction listener to trigger 'loadRandomQuote' upon click events */}
            <Button
              fullWidth
              variant="contained"
              startIcon={<Refresh />}
              sx={{ borderRadius: 2, textTransform: 'none' }}
              onClick ={loadRandomQuote}
            >
              Next Quote
            </Button>
           
          </Stack>

        </Stack>
      </CardContent>
      <Dialog open={showLiked} onClose={() => setShowLiked(false)} fullWidth maxWidth="sm">
        <DialogTitle>Liked Quotes</DialogTitle>
        <DialogContent>
          <List>
            {likedQuotes.length === 0 && <Typography>No liked quotes yet.</Typography>}
            {likedQuotes.map((q, i) => (
              <ListItem key={i}
                secondaryAction={
                  <IconButton edge="end" onClick={() => removeLikedQuote(i)}>
                    <Delete />
                  </IconButton>
                }
              >
                <ListItemText primary={`"${q.text}"`} secondary={`— ${q.author}`} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
