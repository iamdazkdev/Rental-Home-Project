import React from 'react';
import { Box, Skeleton, Container } from '@mui/material';

const PageSkeleton = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton variant="text" width="30%" height={50} />
        <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 2 }} />
      </Box>

      {/* Content Area */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: 2 }} />
      </Box>
    </Container>
  );
};

export default PageSkeleton;
