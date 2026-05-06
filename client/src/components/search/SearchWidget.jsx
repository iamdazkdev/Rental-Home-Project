import React from 'react';
import { 
  Box, Tabs, Tab, Slider, Typography, FormControlLabel, Switch,
  Button, TextField, Autocomplete, Paper 
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import useSearchStore from '../../stores/useSearchStore';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SearchWidget = ({ onSearch }) => {
  const mode = useSearchStore(state => state.mode);
  const setMode = useSearchStore(state => state.setMode);
  const longTermData = useSearchStore(state => state.longTermData);
  const setLongTermData = useSearchStore(state => state.setLongTermData);
  const filters = useSearchStore(state => state.filters);
  const setFilters = useSearchStore(state => state.setFilters);

  const handleModeChange = (event, newValue) => {
    setMode(newValue);
  };

  const handleSearch = () => {
    if (onSearch) onSearch();
  };

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #e0e0e0' }}>
      <Tabs 
        value={mode} 
        onChange={handleModeChange} 
        centered 
        sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 'bold' } }}
      >
        <Tab label="Short-term" value="short_term" />
        <Tab label="Long-term" value="long_term" />
      </Tabs>

      {mode === 'short_term' && (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by location, title..."
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value, page: 1 })}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ flex: 1, minWidth: '250px' }}
          />
          <Button 
            variant="contained" 
            size="large" 
            onClick={handleSearch} 
            startIcon={<SearchIcon />}
            sx={{ height: 56, bgcolor: '#FF385C', '&:hover': { bgcolor: '#D70466' } }}
          >
            Search
          </Button>
        </Box>
      )}

      {mode === 'long_term' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography gutterBottom fontWeight="bold">
              Duration: {longTermData.duration} Month{longTermData.duration > 1 ? 's' : ''}
            </Typography>
            <Slider
              value={longTermData.duration}
              min={1}
              max={12}
              step={1}
              marks
              valueLabelDisplay="auto"
              onChange={(e, val) => setLongTermData({ duration: val })}
              sx={{ color: '#FF385C' }}
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={longTermData.isFlexible}
                onChange={(e) => setLongTermData({ isFlexible: e.target.checked })}
                color="secondary"
              />
            }
            label={longTermData.isFlexible ? "Flexible Mode (Select Months)" : "Exact Mode (Select Date)"}
          />

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {!longTermData.isFlexible ? (
              <TextField
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={longTermData.exactDate}
                onChange={(e) => setLongTermData({ exactDate: e.target.value })}
                sx={{ flex: 1, minWidth: '200px' }}
              />
            ) : (
              <Autocomplete
                multiple
                options={MONTHS}
                value={longTermData.flexibleMonths}
                onChange={(e, val) => {
                  if (val.length <= 3) setLongTermData({ flexibleMonths: val });
                }}
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" label="Select up to 3 months" />
                )}
                sx={{ flex: 1, minWidth: '200px' }}
              />
            )}
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleSearch}
              startIcon={<SearchIcon />}
              sx={{ height: 56, bgcolor: '#FF385C', '&:hover': { bgcolor: '#D70466' } }}
            >
              Search
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default SearchWidget;
