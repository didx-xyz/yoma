package cc.coopersoft.keycloak.phone.providers.sender;

import java.util.Set;

import org.jboss.logging.Logger;

import com.twilio.Twilio;
import com.twilio.exception.ApiException;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

import cc.coopersoft.keycloak.phone.providers.constants.MessageSendResult;
import cc.coopersoft.keycloak.phone.providers.exception.MessageRecipientException;
import cc.coopersoft.keycloak.phone.providers.exception.MessageSendException;
import cc.coopersoft.keycloak.phone.providers.spi.FullSmsSenderAbstractService;

public class TwilioSmsSenderServiceProvider extends FullSmsSenderAbstractService {

    private static final Logger logger = Logger.getLogger(TwilioSmsSenderServiceProvider.class);

    // Twilio errors meaning this recipient cannot be reached: invalid number (21211),
    // not a mobile number (21614), not on WhatsApp (63003), invalid recipient (63024)
    private static final Set<Integer> RECIPIENT_ERROR_CODES = Set.of(21211, 21614, 63003, 63024);

    private static final String UNREACHABLE_MESSAGE = "We couldn't reach you on WhatsApp, and we don't currently support sending SMS's to your country. Please use a WhatsApp registered number, or an email address.";
    private static final String WHATSAPP_UNAVAILABLE_MESSAGE = "We couldn't send your code on WhatsApp right now. Please try again in a few minutes, or use an email address.";

    private final String accountSID;
    private final String authToken;
    private final String fromNumber;
    private final String whatsappFromNumber;
    private final String whatsappAppHash;
    private final String whatsappTemplateId;
    private final boolean whatsappEnabled;
    private boolean twilioInitialized = false;

    public TwilioSmsSenderServiceProvider(String realmDisplay, String accountSID, String authToken, String fromNumber,
            String whatsappFromNumber, String whatsappAppHash, String whatsappTemplateId) {
        super(realmDisplay);
        this.accountSID = accountSID;
        this.authToken = authToken;
        this.fromNumber = fromNumber;
        this.whatsappFromNumber = whatsappFromNumber;
        this.whatsappAppHash = whatsappAppHash;
        this.whatsappTemplateId = whatsappTemplateId;
        this.whatsappEnabled = whatsappFromNumber != null && !whatsappFromNumber.isEmpty();

        // Verify we have required credentials
        if (accountSID == null || accountSID.trim().isEmpty() || authToken == null || authToken.trim().isEmpty()) {
            logger.error("Twilio credentials missing! accountSID or authToken is null or empty.");
            return; // Skip initialization to prevent further errors
        }

        if (fromNumber == null || fromNumber.trim().isEmpty()) {
            logger.error("Twilio SMS number is missing! SMS sending will fail.");
        }

        // Initialize Twilio client
        try {
            // Reinitialize Twilio with each instance to ensure correct credentials
            Twilio.init(accountSID, authToken);
            twilioInitialized = true;
        } catch (Exception e) {
            logger.error("Failed to initialize Twilio client: " + e.getMessage(), e);
        }
    }

    @Override
    public MessageSendResult sendMessage(String phoneNumber, String message) throws MessageSendException {
        // Validate configuration before sending
        if (!twilioInitialized) {
            String errorMsg = "Cannot send message: Twilio client not properly initialized";
            logger.error(errorMsg);
            throw new MessageSendException(errorMsg, new Throwable("MSG0004"));
        }

        // Reinitialize Twilio to ensure credentials are set (safety measure)
        try {
            Twilio.init(accountSID, authToken);
        } catch (Exception e) {
            logger.error("Failed to reinitialize Twilio client before sending: " + e.getMessage(), e);
            throw new MessageSendException("Failed to initialize Twilio client: " + e.getMessage(), e);
        }

        // currently only South Africa is supported for SMS
        boolean smsSupported = phoneNumber.startsWith("+27");

        // Try WhatsApp first if enabled
        if (whatsappEnabled) {
            try {
                if (sendWhatsAppMessage(phoneNumber, message)) {
                    logger.info("WhatsApp delivery confirmed to: " + phoneNumber);
                    return MessageSendResult.SENT; // If WhatsApp is delivered, don't attempt SMS
                }
                if (!smsSupported) {
                    // The code can still arrive, so it is kept and the user is told delivery is unconfirmed
                    logger.info("WhatsApp dispatch accepted but delivery not confirmed to: " + phoneNumber);
                    return MessageSendResult.DELIVERY_UNCONFIRMED;
                }
                logger.info("WhatsApp delivery not confirmed to: " + phoneNumber + ", also sending SMS");
            } catch (MessageSendException e) {
                if (!smsSupported) {
                    logger.warn("WhatsApp message failed and SMS is not supported for: " + phoneNumber + ": " + e.getMessage());
                    if (e instanceof MessageRecipientException) {
                        throw new MessageRecipientException(UNREACHABLE_MESSAGE, e);
                    }
                    throw new MessageSendException(WHATSAPP_UNAVAILABLE_MESSAGE, e);
                }
                logger.warn("WhatsApp message failed, falling back to SMS: " + e.getMessage());
                // Continue to SMS fallback
            }
        }

        if (!smsSupported) {
            logger.error("Phone number must start with +27");
            throw new MessageRecipientException(UNREACHABLE_MESSAGE, null);
        }

        // SMS as primary or fallback
        try {
            Message message_response = Message.creator(
                    new PhoneNumber(phoneNumber),
                    new PhoneNumber(fromNumber),
                    message)
                    .create();

            logger.info("SMS sent successfully, SID: " + message_response.getSid());
            return MessageSendResult.SENT;
        } catch (ApiException e) {
            logger.error("Twilio API exception sending SMS: " + e.getMessage() + ", Code: " + e.getCode() + ", Status: " + e.getStatusCode());
            throw new MessageSendException(e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error sending SMS: " + e.getMessage(), e);
            throw new MessageSendException(e.getMessage(), e);
        }
    }

    /**
     * @return true if delivery was confirmed, false if the message was
     *         dispatched but not confirmed as delivered in time
     */
    private boolean sendWhatsAppMessage(String phoneNumber, String message) throws MessageSendException {
        try {
            // Ensure the WhatsApp numbers have both the "whatsapp:" prefix and "+" in the country code
            String formattedToNumber = phoneNumber.startsWith("whatsapp:") ? phoneNumber : "whatsapp:" + phoneNumber;

            // Ensure the from number has the "+" if it's missing
            String fromNumberWithPlus = whatsappFromNumber;
            if (!whatsappFromNumber.contains("+")) {
                fromNumberWithPlus = whatsappFromNumber.replaceFirst("^whatsapp:", "whatsapp:+");
                if (!fromNumberWithPlus.startsWith("whatsapp:")) {
                    fromNumberWithPlus = "whatsapp:+" + whatsappFromNumber;
                }
            } else if (!whatsappFromNumber.startsWith("whatsapp:")) {
                fromNumberWithPlus = "whatsapp:" + whatsappFromNumber;
            }

            // Add the app hash to the message if available
            String messageWithAppHash = message;
            if (whatsappAppHash != null && !whatsappAppHash.isEmpty()) {
                messageWithAppHash = message + "\n\n" + whatsappAppHash;
            }

            // Create a Message.Creator instance
            var creator = Message.creator(
                    new PhoneNumber(formattedToNumber),
                    new PhoneNumber(fromNumberWithPlus),
                    messageWithAppHash);

            // Check if we should use a template
            boolean usingTemplate = whatsappTemplateId != null && !whatsappTemplateId.isEmpty();
            if (usingTemplate) {
                creator.setContentSid(whatsappTemplateId);

                // Extract OTP code from the message - assuming the code is 6 digits
                String otpCode = extractOTPFromMessage(message);
                // Properly formatted JSON with double quotes
                creator.setContentVariables("{\"1\":\"" + otpCode + "\"}");
            }

            // Send the message and capture response
            Message messageResponse = creator.create();
            String messageSid = messageResponse.getSid();
            logger.info("WhatsApp message sent with SID: " + messageSid);

            // Poll for message status to verify delivery
            return checkMessageDeliveryStatus(messageSid);

        } catch (ApiException e) {
            // Common Twilio error codes for WhatsApp
            if (e.getCode() == 20422) {
                logger.error("WhatsApp error 20422 typically means invalid number format or parameter issue. "
                        + "Make sure phone numbers include country code and WhatsApp is provisioned for this account.");
            } else if (e.getCode() == 21211) {
                logger.error("WhatsApp error 21211 typically means the recipient is not a valid/verified WhatsApp user.");
            } else if (e.getCode() == 21606) {
                logger.error("WhatsApp error 21606 indicates the message violates WhatsApp's policies.");
            } else if (e.getCode() == 21610) {
                logger.error("WhatsApp error 21610 indicates the template hasn't been approved or doesn't exist.");
            }

            if (RECIPIENT_ERROR_CODES.contains(e.getCode())) {
                throw new MessageRecipientException("WhatsApp error: " + e.getMessage(), e);
            }
            throw new MessageSendException("WhatsApp error: " + e.getMessage(), e);
        } catch (MessageSendException e) {
            throw e;
        } catch (Exception e) {
            logger.warn("WhatsApp general exception: " + e.getMessage());
            throw new MessageSendException("WhatsApp general exception: " + e.getMessage(), e);
        }
    }

    /**
     * Polls a WhatsApp message for a delivery receipt. "delivered" and "read"
     * are confirmed delivery. "sent" means the message was handed to WhatsApp
     * but not yet confirmed on the handset, so polling continues.
     *
     * @param messageSid The SID of the message to check
     * @return true if delivered, false if it reached "sent" but delivery was
     *         not confirmed after all checks
     * @throws MessageRecipientException if WhatsApp could not reach the recipient
     * @throws MessageSendException if the message failed for another reason, or
     *                              was still queued or sending after all checks
     */
    private boolean checkMessageDeliveryStatus(String messageSid) throws MessageSendException {
        final int MAX_RETRY = 8;
        final int RETRY_DELAY_MS = 2000; // 2 seconds between checks
        boolean dispatched = false;

        for (int attempt = 0; attempt < MAX_RETRY; attempt++) {
            try {
                // Add a small delay between status checks
                if (attempt > 0) {
                    Thread.sleep(RETRY_DELAY_MS);
                }

                // Fetch the message status
                Message fetchedMessage = Message.fetcher(messageSid).fetch();
                String status = fetchedMessage.getStatus().toString();

                logger.info("WhatsApp message " + messageSid + " status: " + status);

                // Check message status
                switch (status) {
                    case "delivered":
                        // Consider delivered as successful state
                        logger.info("WhatsApp message " + messageSid + " successfully delivered");
                        return true;
                    case "read":
                        // Message was read by recipient, consider as successful state
                        logger.info("WhatsApp message " + messageSid + " was read by recipient");
                        return true;
                    case "sent":
                        // Handed to WhatsApp; keep checking for the delivery receipt
                        dispatched = true;
                        continue;
                    case "queued":
                    case "sending":
                        // Still processing, continue to next attempt
                        continue;
                    case "undelivered":
                    case "failed":
                        Integer errorCode = fetchedMessage.getErrorCode();
                        String failure = "WhatsApp message delivery failed. Status: " + status + ", error code: " + errorCode;
                        logger.warn("WhatsApp message " + messageSid + ": " + failure);
                        if (errorCode != null && RECIPIENT_ERROR_CODES.contains(errorCode)) {
                            throw new MessageRecipientException(failure, null);
                        }
                        throw new MessageSendException(failure, null);
                    default:
                        logger.warn("Unknown WhatsApp message status: " + status);
                    // Continue checking on unknown status
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                logger.warn("Thread interrupted while waiting for WhatsApp status check");
            } catch (ApiException e) {
                logger.error("Error checking WhatsApp message status: " + e.getMessage());
                // Continue checking despite API errors
            }
        }

        if (dispatched) {
            logger.warn("WhatsApp message " + messageSid + " dispatched but delivery not confirmed after " + MAX_RETRY + " attempts");
            return false;
        }

        // Never left Twilio's queue, so treat it as not sent
        logger.warn("Could not confirm WhatsApp message dispatch after " + MAX_RETRY + " attempts");
        throw new MessageSendException("WhatsApp message was not dispatched after multiple checks", null);
    }

    /**
     * Extract the OTP code from the message. Assumes the message contains a
     * 6-digit code.
     *
     * @param message The message containing the OTP
     * @return The extracted OTP code, or "000000" if not found
     */
    private String extractOTPFromMessage(String message) {
        // Simple regex to find a 6-digit code in the message
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\b\\d{6}\\b");
        java.util.regex.Matcher matcher = pattern.matcher(message);
        if (matcher.find()) {
            return matcher.group(0);
        }
        logger.warn("Could not extract OTP code from message. Using default.");
        return "000000"; // Default fallback if no code found
    }

    @Override
    public void close() {
        // Nothing to close
    }
}
