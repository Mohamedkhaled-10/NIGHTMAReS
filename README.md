# Nightmares CMS

## Firebase Security Rules Update
To apply the strict security rules we just created, you must copy the contents of `firestore.rules` and paste them into your Firebase Console > Firestore > Rules tab, then click Publish.

## Setting up an Admin User
1. Create a user via the `/login.html` page (which we will temporarily allow, or you can create one in Firebase Console).
2. Download your Firebase Admin Service Account Key (Project Settings > Service Accounts > Generate new private key).
3. Save it in the project root as `serviceAccountKey.json`.
4. Run the script: `npm run set-admin <USER_UID>`
