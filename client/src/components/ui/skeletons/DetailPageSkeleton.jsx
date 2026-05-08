import React from 'react';
import { Box, Skeleton, Container, Grid } from '@mui/material';

const DetailPageSkeleton = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Title Section */}
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width="60%" height={50} />
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Skeleton variant="text" width="20%" height={24} />
          <Skeleton variant="text" width="15%" height={24} />
        </Box>
      </Box>

      {/* Image Gallery */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 1, mb: 4, height: 400 }}>
        <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: '12px 0 0 12px' }} />
        <Box sx={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 1 }}>
          <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: '0 12px 0 0' }} />
          <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: '0 0 12px 0' }} />
        </Box>
      </Box>

      {/* Content Section */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {/* Host Info */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 3, borderBottom: '1px solid #eee' }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="40%" height={32} />
              <Skeleton variant="text" width="30%" height={24} sx={{ mt: 1 }} />
            </Box>
            <Skeleton variant="circular" width={56} height={56} />
          </Box>

          {/* Description */}
          <Box sx={{ mb: 4 }}>
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="90%" height={20} />
            <Skeleton variant="text" width="95%" height={20} />
            <Skeleton variant="text" width="60%" height={20} />
          </Box>

          {/* Amenities */}
          <Box sx={{ mb: 4 }}>
            <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {Array.from(new Array(6)).map((_, idx) => (
                <Grid item xs={6} key={idx}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width="60%" height={24} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Booking Widget */}
          <Skeleton variant="rectangular" width="100%" height={350} sx={{ borderRadius: 3, position: 'sticky', top: 100 }} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default DetailPageSkeleton;
