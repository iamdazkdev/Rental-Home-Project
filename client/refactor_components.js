const fs = require('fs');
const path = require('path');

const clientSrcPath = path.join(__dirname, 'src');
const componentsPath = path.join(clientSrcPath, 'components');

const moves = {
  // ui
  'Loader.jsx': 'ui',
  // payment
  'CheckoutModal.jsx': 'payment',
  'RecordPaymentModal.jsx': 'payment',
  'CashPaymentConfirmModal.jsx': 'payment',
  'PaymentBreakdownCard.jsx': 'payment',
  'PaymentButton.jsx': 'payment',
  'PaymentHistory.jsx': 'payment',
  'PaymentSuccessModal.jsx': 'payment',
  // booking
  'BookingWidget.jsx': 'booking',
  'BookingLockIndicator.jsx': 'booking',
  'BookingSuccessModal.jsx': 'booking',
  'CancelBookingModal.jsx': 'booking',
  'ExtendStayModal.jsx': 'booking',
  'RejectBookingModal.jsx': 'booking',
  'RequestResultModal.jsx': 'booking',
  // listing
  'Listing.jsx': 'listing',
  'ListingCard.jsx': 'listing',
  'ListingLockedMessage.jsx': 'listing',
  'Categories.jsx': 'listing',
  'Types.jsx': 'listing',
  // verification
  'IdentityVerificationForm.jsx': 'verification',
  'VerificationReviewModal.jsx': 'verification',
  'VerificationSuccessModal.jsx': 'verification',
  // review
  'ReviewModal.jsx': 'review',
  'Reviews.jsx': 'review',
  // layout
  'Navbar.jsx': 'layout',
  'Footer.jsx': 'layout',
  'Slide.jsx': 'layout',
  'NotificationDropdown.jsx': 'layout'
};

// Ensure directories exist
const dirs = [...new Set(Object.values(moves))];
dirs.forEach(dir => {
  const dirPath = path.join(componentsPath, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Update imports BEFORE moving, so we know their old locations
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const allFiles = getAllFiles(clientSrcPath);

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let hasChanges = false;
  
  // We need to figure out the relative path depth from this file to components/
  const fileDir = path.dirname(file);
  let relativeToComponents = path.relative(fileDir, componentsPath);
  if (relativeToComponents === '') {
    relativeToComponents = '.';
  } else if (!relativeToComponents.startsWith('.')) {
    relativeToComponents = './' + relativeToComponents;
  }
  
  for (const [compFile, folder] of Object.entries(moves)) {
    const compName = compFile.replace('.jsx', '');
    
    // Replace standard imports like `import X from "../../components/X"`
    const regex1 = new RegExp(`(from\\s+['"])(.*?\\/components)\\/(${compName})(['"])`, 'g');
    if (regex1.test(content)) {
      content = content.replace(regex1, `$1$2/${folder}/$3$4`);
      hasChanges = true;
    }
    
    // Replace sibling imports if the file was in components/
    // like `import X from "./Loader"`
    const regex2 = new RegExp(`(from\\s+['"])\\.\\/(${compName})(['"])`, 'g');
    if (regex2.test(content)) {
      // If this file itself is moving, its new path will be in some `folder2`
      const thisFileName = path.basename(file);
      const thisFileFolder = moves[thisFileName] || '';
      
      let newRelative = ``;
      if (thisFileFolder === folder) {
        newRelative = `./${compName}`; // moving to same folder
      } else if (thisFileFolder) {
        newRelative = `../${folder}/${compName}`; // both moved to diff folders
      } else {
        newRelative = `./${folder}/${compName}`; // target moved, this didn't
      }
      
      content = content.replace(regex2, `$1${newRelative}$3`);
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    fs.writeFileSync(file, content);
  }
}

// Move files AFTER updating
for (const [file, folder] of Object.entries(moves)) {
  const oldPath = path.join(componentsPath, file);
  const newPath = path.join(componentsPath, folder, file);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
  }
}

console.log('Refactor completed successfully!');
