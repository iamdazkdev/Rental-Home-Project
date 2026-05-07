import React from 'react';
import { 
  Snackbar, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button,
  Slide
} from '@mui/material';
import useNotificationStore from '../../stores/useNotificationStore';

const TransitionUp = React.forwardRef(function TransitionUp(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const GlobalNotification = () => {
  const { toast, confirmDialog, hideToast } = useNotificationStore();

  return (
    <>
      {/* Global Toast / Snackbar */}
      <Snackbar
        open={toast.isOpen}
        autoHideDuration={4000}
        onClose={hideToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={TransitionUp}
      >
        <Alert 
          onClose={hideToast} 
          severity={toast.severity} 
          variant="filled"
          sx={{ width: '100%', borderRadius: 2, boxShadow: 3 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      {/* Global Confirm Dialog */}
      <Dialog
        open={confirmDialog.isOpen}
        onClose={() => confirmDialog.onCancel && confirmDialog.onCancel()}
        PaperProps={{
          sx: { borderRadius: 3, p: 1, minWidth: 350 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '1.1rem' }}>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 2 }}>
          <Button 
            onClick={() => confirmDialog.onCancel && confirmDialog.onCancel()} 
            color="inherit"
            sx={{ fontWeight: 'bold' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => confirmDialog.onConfirm && confirmDialog.onConfirm()} 
            variant="contained" 
            color="error" // usually confirms are destructive, or we could make color dynamic
            autoFocus
            sx={{ fontWeight: 'bold', borderRadius: 2 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GlobalNotification;
