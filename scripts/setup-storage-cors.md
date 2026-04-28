# Firebase Storage CORS Setup

The CORS errors you're seeing indicate that Firebase Storage needs to be configured to allow requests from your web application.

## Quick Fix Options

### Option 1: Use Google Cloud Console (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to "Cloud Storage" > "Buckets"
4. Find your Firebase Storage bucket (usually named like `your-project-id.appspot.com`)
5. Click on the bucket name
6. Go to the "Permissions" tab
7. Click "Add Principal"
8. Add `allUsers` as principal
9. Select role "Storage Object Viewer"
10. Save

### Option 2: Use gsutil Command Line (Advanced)

If you have Google Cloud SDK installed:

```bash
# Install Google Cloud SDK first if you haven't
# Then authenticate
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Apply CORS configuration
gsutil cors set firebase-storage-cors.json gs://YOUR_BUCKET_NAME
```

Replace `YOUR_PROJECT_ID` and `YOUR_BUCKET_NAME` with your actual values.

### Option 3: Firebase Storage Rules (Alternative)

Update your Firebase Storage security rules in the Firebase Console:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
      allow read: if true; // Allow public read access
    }
  }
}
```

## Temporary Workaround

For immediate testing, you can temporarily disable web security in Chrome:

**⚠️ WARNING: Only use this for development testing!**

1. Close all Chrome windows
2. Start Chrome with: `chrome --disable-web-security --user-data-dir="C:/temp/chrome_dev_session"`
3. Test your application

## Verify CORS is Fixed

After applying any of the above solutions:

1. Refresh your application
2. Try uploading a document in "Create New CSF"
3. Complete a CSF form and try downloading
4. Check browser console for CORS errors

## Alternative: Use Firebase Functions

If CORS issues persist, consider using Firebase Functions as a proxy:

1. Create a Firebase Function that handles file uploads
2. Your web app calls the function instead of directly accessing Storage
3. The function handles the Storage operations server-side

This eliminates CORS issues entirely since server-to-server communication doesn't have CORS restrictions.