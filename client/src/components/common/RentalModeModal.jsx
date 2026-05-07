import React from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, Box, Typography } from '@mui/material';
import { Close as CloseIcon, CalendarMonth, LocationCity } from '@mui/icons-material';
import './RentalModeModal.scss';

const RentalModeModal = ({ open, onClose, onSelect }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: '16px',
          padding: '12px'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, pb: 1 }}>
        <Typography variant="h5" component="div" fontWeight="bold" textAlign="center">
          How do you plan to rent?
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" mt={1}>
          Choose your rental style to see the correct pricing and availability.
        </Typography>
        {onClose && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      
      <DialogContent sx={{ p: 2, pt: 2 }}>
        <Box className="rental-mode-container">
          <div 
            className="rental-mode-card short-term"
            onClick={() => onSelect('short_term')}
          >
            <div className="icon-wrapper">
              <CalendarMonth fontSize="large" />
            </div>
            <div className="card-content">
              <h3>Short-term (Daily)</h3>
              <p>Perfect for vacations, weekend getaways, or business trips. Book by the day.</p>
            </div>
          </div>

          <div 
            className="rental-mode-card long-term"
            onClick={() => onSelect('long_term')}
          >
            <div className="icon-wrapper">
              <LocationCity fontSize="large" />
            </div>
            <div className="card-content">
              <h3>Long-term (Monthly)</h3>
              <p>Ideal for digital nomads or relocation. Book from 1 to 12 months with flexible options.</p>
            </div>
          </div>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default RentalModeModal;
