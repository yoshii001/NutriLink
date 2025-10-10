// services/stripeService.ts
import { STRIPE_CONFIG } from '@/config/stripe';
import { addDonation } from '@/services/firebase/donationService';
import { updateFulfilledAmount } from '@/services/firebase/donationRequestService';
import { Donation } from '@/types';

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

interface DonationPaymentData {
  amount: number;
  donorId: string;
  donorName: string;
  donorEmail: string;
  schoolId?: string;
  mealPlanId?: string;
  donationRequestId?: string;
  donorMessage: string;
  mealContribution: number;
  // Card details (only used for test-mode simulation in this demo)
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  cardholderName?: string;
}

// Create a payment intent using Stripe API
export const createPaymentIntent = async (
  amount: number,
  metadata: Record<string, string>
): Promise<PaymentIntentResponse> => {
  try {
    // Prefer creating PaymentIntent via a backend to keep the secret key secure.
    if (STRIPE_CONFIG.BACKEND_URL) {
      try {
        const resp = await fetch(`${STRIPE_CONFIG.BACKEND_URL.replace(/\/$/, '')}/create-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Math.round(amount), currency: STRIPE_CONFIG.currency, metadata }),
        });

        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          console.error('[stripeService] backend create-payment-intent failed', resp.status, text);
          throw new Error(`Backend failed to create payment intent: ${resp.status} ${text}`);
        }

        const data = await resp.json();
        return {
          clientSecret: data.clientSecret || data.client_secret,
          paymentIntentId: data.id || data.paymentIntentId || data.id,
        };
      } catch (err: any) {
        // Backend may be unreachable from the device (e.g. localhost in Expo Go).
        // Log as a warning and fall back to test-mode behavior below.
        console.warn('[stripeService] error calling backend create-payment-intent', err && err.message ? err.message : String(err));
        // Fall through to test-mode/mocked behavior below
      }
    }

    // If BACKEND_URL is not configured or backend failed, fall back to test-mode mock
    if (STRIPE_CONFIG.testMode) {
      console.log('[stripeService] testMode enabled - returning mocked PaymentIntent');
      return {
        clientSecret: `pi_client_secret_mock_${Date.now()}`,
        paymentIntentId: `pi_mock_${Date.now()}`,
      };
    }

    throw new Error('No backend configured for creating PaymentIntent and testMode is disabled.');
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Process donation payment
export const processDonationPayment = async (
  paymentData: DonationPaymentData
): Promise<string> => {
  try {
    // Basic card handling for demo/test mode
    if (STRIPE_CONFIG.testMode) {
      const cleaned = (paymentData.cardNumber || '').replace(/\s/g, '');
      // Simulate common test outcomes
      if (cleaned === TEST_CARDS.DECLINED) {
        const err = new Error('Your card was declined');
        // attach a code for callers if needed
        // @ts-ignore
        err.code = 'card_declined';
        throw err;
      }

      if (cleaned === TEST_CARDS.INSUFFICIENT_FUNDS) {
        const err = new Error('Insufficient funds');
        // @ts-ignore
        err.code = 'insufficient_funds';
        throw err;
      }

      if (cleaned === TEST_CARDS.EXPIRED) {
        const err = new Error('Expired card');
        // @ts-ignore
        err.code = 'expired_card';
        throw err;
      }

      if (cleaned === TEST_CARDS.PROCESSING_ERROR) {
        const err = new Error('Processing error. Try again later');
        // @ts-ignore
        err.code = 'processing_error';
        throw err;
      }

      // If it's not a known failure card, assume success for demo (e.g., 4242...)
    }
    // Create payment intent
    const { paymentIntentId } = await createPaymentIntent(
      paymentData.amount,
      {
        donorId: paymentData.donorId,
        donorEmail: paymentData.donorEmail,
        schoolId: paymentData.schoolId || '',
        mealPlanId: paymentData.mealPlanId || '',
        donationRequestId: paymentData.donationRequestId || '',
      }
    );

    // Create donation record in Firebase (only include defined fields)
    const toSave: any = {
      donorId: paymentData.donorId,
      amount: paymentData.amount,
      mealContribution: paymentData.mealContribution,
      date: new Date().toISOString(),
      status: 'completed',
    };

    if (paymentData.donorName !== undefined && paymentData.donorName !== null) toSave.donorName = paymentData.donorName;
    if (paymentData.donorEmail !== undefined && paymentData.donorEmail !== null) toSave.donorEmail = paymentData.donorEmail;
    if (paymentData.donorMessage !== undefined && paymentData.donorMessage !== null) toSave.donorMessage = paymentData.donorMessage;
    // Only include optional fields if they are not undefined/null/empty string
    if (paymentData.schoolId !== undefined && paymentData.schoolId !== null && paymentData.schoolId !== '') toSave.schoolId = paymentData.schoolId;
    if (paymentData.mealPlanId !== undefined && paymentData.mealPlanId !== null && paymentData.mealPlanId !== '') toSave.mealPlanId = paymentData.mealPlanId;

    // Log sanitized object for debugging
    console.log('[stripeService] saving donation to Firebase', toSave);

    let donationId: string;
    try {
      donationId = await addDonation(toSave as Donation);
    } catch (err) {
      console.error('Error saving donation to Firebase:', err, { toSave });
      throw new Error(`Failed to save donation: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Update donation request fulfilled amount if applicable
    if (paymentData.donationRequestId) {
      try {
        await updateFulfilledAmount(paymentData.donationRequestId, paymentData.amount);
      } catch (err) {
        console.error('Error updating fulfilled amount for donationRequestId=', paymentData.donationRequestId, err);
        // Don't block success of donation creation; surface warning instead
      }
    }

    return donationId;
  } catch (error) {
    console.error('Error processing donation payment:', error);
    throw error;
  }
};

// Test card numbers for Stripe test mode
export const TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINED: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000009995',
  EXPIRED: '4000000000000069',
  PROCESSING_ERROR: '4000000000000119',
};

// Validate card number (basic Luhn algorithm)
export const validateCardNumber = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// Format card number with spaces
export const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\s/g, '');
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(' ') : cleaned;
};

// Validate expiry date
export const validateExpiryDate = (month: string, year: string): boolean => {
  const now = new Date();
  const currentYear = now.getFullYear() % 100; // Get last 2 digits
  const currentMonth = now.getMonth() + 1;

  const expMonth = parseInt(month);
  const expYear = parseInt(year);

  if (expMonth < 1 || expMonth > 12) return false;
  if (expYear < currentYear) return false;
  if (expYear === currentYear && expMonth < currentMonth) return false;

  return true;
};

// Validate CVV
export const validateCVV = (cvv: string): boolean => {
  return /^\d{3,4}$/.test(cvv);
};
