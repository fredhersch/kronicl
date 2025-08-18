// Temporary debug script - paste this in browser console after OAuth
// to check authentication state

console.log('=== Auth Debug Info ===');
console.log('Current URL:', window.location.href);
console.log('Cookies:', document.cookie);
console.log('Local Storage:', localStorage);

// Check if Firebase auth is working
if (window.firebase && window.firebase.auth) {
    const user = window.firebase.auth().currentUser;
    console.log('Firebase User:', user);
    console.log('User UID:', user?.uid);
    console.log('Provider Data:', user?.providerData);
}

// Check session cookie specifically
const sessionCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('__session='));
console.log('Session Cookie:', sessionCookie ? 'Present' : 'Missing');

