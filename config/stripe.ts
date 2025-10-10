// config/stripe.ts
export const STRIPE_CONFIG = {
  publishableKey: 'pk_test_51SG0xxFpwp9uaJI6Rq1fzokeZP36mXnG1d5UODVGheZb7C1sROskO0jqu4QSPt0XmeH5bzXsFu7XdNUfq7zoxt4600j58pBDnt',
  currency: 'usd',
  testMode: true,
  // secretKey must NOT be used in client code. Use the server at BACKEND_URL to create PaymentIntents.
  BACKEND_URL: 'http://localhost:4242'
};

// Note: In production, never expose secret keys in frontend code
// This should be handled by a backend server
