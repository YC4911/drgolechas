export type ExternalIdentityProvider = "google" | "phone-otp";

export interface ExternalAuthAvailability {
  google: boolean;
  phoneOtp: boolean;
}

export function getExternalAuthAvailability(): ExternalAuthAvailability {
  return {
    google: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    ),
    phoneOtp: Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID,
    ),
  };
}
