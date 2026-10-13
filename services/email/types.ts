export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

export type EmailTemplateData = {
  welcome: { name: string; signInUrl: string };
  passwordReset: { resetUrl: string };
  orderConfirmation: {
    name: string;
    orderNumber: string;
    total: string;
    orderUrl: string;
  };
  paymentConfirmation: {
    name: string;
    orderNumber: string;
    total: string;
    orderUrl: string;
  };
  orderShipped: {
    name: string;
    orderNumber: string;
    trackingNumber: string;
    orderUrl: string;
  };
  orderDelivered: { name: string; orderNumber: string; orderUrl: string };
  cancellation: { name: string; orderNumber: string; orderUrl: string };
  refund: {
    name: string;
    orderNumber: string;
    amount: string;
    orderUrl: string;
  };
};

export type EmailTemplate = keyof EmailTemplateData;
