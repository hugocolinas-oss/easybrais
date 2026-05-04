export { getSmtpConfig, type SmtpConfig } from "./config";
export {
  sendEmail,
  sendTestEmail,
  type SendEmailInput,
  type SendEmailResult,
  type EmailAttachment,
} from "./send";
export {
  bookingConfirmationSubject,
  bookingConfirmationHtml,
  type BookingConfirmationData,
} from "./templates";
