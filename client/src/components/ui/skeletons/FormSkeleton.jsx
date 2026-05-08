import React from 'react';
import { Box, Skeleton, Paper } from '@mui/material';

const FormSkeleton = () => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', p: 2 }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 450, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Skeleton variant="text" width="60%" height={40} sx={{ mx: 'auto', mb: 1 }} />
          <Skeleton variant="text" width="40%" height={24} sx={{ mx: 'auto' }} />
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Skeleton variant="text" width="30%" height={20} />
          </Box>
          
          <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 8, mt: 1 }} />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Skeleton variant="text" width="50%" height={20} />
        </Box>
      </Paper>
    </Box>
  );
};

export default FormSkeleton;
