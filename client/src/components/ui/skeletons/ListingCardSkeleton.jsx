import React from 'react';
import { Box, Skeleton } from '@mui/material';

const ListingCardSkeleton = () => {
  return (
    <Box sx={{ width: '100%', maxWidth: 350, m: 1 }}>
      <Skeleton variant="rectangular" width="100%" height={250} sx={{ borderRadius: 3 }} />
      <Box sx={{ pt: 1, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="20%" height={24} />
        </Box>
        <Skeleton variant="text" width="40%" height={20} />
        <Skeleton variant="text" width="80%" height={20} />
        <Skeleton variant="text" width="30%" height={24} sx={{ mt: 1 }} />
      </Box>
    </Box>
  );
};

export const ListingGridSkeleton = ({ count = 8 }) => {
  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', lg: 'repeat(4, 1fr)' }, 
      gap: 3,
      padding: 3
    }}>
      {Array.from(new Array(count)).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </Box>
  );
};

export default ListingCardSkeleton;
