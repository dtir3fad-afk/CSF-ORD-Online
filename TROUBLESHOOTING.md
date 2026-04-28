# CSF System Troubleshooting Guide

## CORS Errors (Most Common Issue)

### Symptoms
- Browser console shows CORS policy errors
- File uploads fail
- Document downloads don't work
- Errors mention "blocked by CORS policy"

### Quick Fixes

#### 1. Firebase Storage Rules (Easiest)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Storage" in the left menu
4. Click on "Rules" tab
5. Replace the rules with:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
      allow read: if true; // Allow public read for downloads
    }
  }
}
```
6. Click "Publish"

#### 2. Google Cloud Console Method
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to "Cloud Storage" > "Buckets"
4. Find your bucket (usually `projectname.appspot.com`)
5. Click "Permissions" tab
6. Click "Grant Access"
7. Add `allUsers` with role "Storage Object Viewer"

#### 3. Development Workaround
For testing only, start Chrome with disabled security:
```bash
chrome --disable-web-security --user-data-dir="C:/temp/chrome_dev"
```
⚠️ **Only use this for development!**

## File Upload Issues

### Problem: "Upload failed" errors
**Solution:** Check Firebase Storage is enabled and rules allow writes

### Problem: File validation errors
**Solution:** Ensure files are PDF, DOC, or DOCX and under 10MB

## Authentication Issues

### Problem: "Permission denied" errors
**Solution:** 
1. Check if you're logged in as admin
2. Verify Firebase Auth is configured
3. Run `npx tsx scripts/create-first-admin.ts` to create admin user

## Database Connection Issues

### Problem: Firestore errors
**Solution:**
1. Check `.env.local` has correct Firebase config
2. Ensure Firestore is enabled in Firebase Console
3. Run `npx tsx scripts/init-firestore.ts` to initialize

## Sample Data Issues

### Problem: Sample CSFs don't download real documents
**Solution:** This is expected - sample data uses placeholder URLs. Create a new CSF with real file upload to test downloads.

## Development Server Issues

### Problem: Build errors or module not found
**Solution:**
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install`
3. Run `npm run dev`

## Need Help?

1. Check browser console for specific error messages
2. Verify all Firebase services are enabled
3. Ensure `.env.local` has all required variables
4. Try creating a fresh CSF template with file upload

## Common Error Messages

| Error | Solution |
|-------|----------|
| "CORS policy" | Configure Firebase Storage CORS (see above) |
| "Permission denied" | Check Firebase rules and authentication |
| "Document not found" | Use real CSF template, not sample data |
| "Upload failed" | Check file type/size and Storage rules |
| "Auth configuration not found" | Verify Firebase Auth setup |