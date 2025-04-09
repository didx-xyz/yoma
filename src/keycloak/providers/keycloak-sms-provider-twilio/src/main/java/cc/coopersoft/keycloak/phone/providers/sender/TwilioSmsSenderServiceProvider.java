package cc.coopersoft.keycloak.phone.providers.sender;

import org.jboss.logging.Logger;

import com.twilio.Twilio;
import com.twilio.exception.ApiException;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

import cc.coopersoft.keycloak.phone.providers.exception.MessageSendException;
import cc.coopersoft.keycloak.phone.providers.spi.FullSmsSenderAbstractService;

public class TwilioSmsSenderServiceProvider extends FullSmsSenderAbstractService {

    private static final Logger logger = Logger.getLogger(TwilioSmsSenderServiceProvider.class);

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
    public void sendMessage(String phoneNumber, String message) throws MessageSendException {
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

        // Try WhatsApp first if enabled
        if (whatsappEnabled) {
            try {
                sendWhatsAppMessage(phoneNumber, message);
                logger.info("WhatsApp delivery successful to: " + phoneNumber);
                return; // If WhatsApp succeeds, don't attempt SMS
            } catch (Exception e) {
                logger.warn("WhatsApp message failed, falling back to SMS: " + e.getMessage());
                // Continue to SMS fallback
            }
        }

        // SMS as primary or fallback
        try {
            // currently only South Africa is supported
            if (!phoneNumber.startsWith("+27")) {
                logger.error("Phone number must start with +27");
                throw new MessageSendException("We couldn't find you on WhatsApp, and we don't currently support sending SMS's to your country. Please use a WhatsApp registered number, or an email address.", null);
            }

            Message message_response = Message.creator(
                    new PhoneNumber(phoneNumber),
                    new PhoneNumber(fromNumber),
                    message)
                    .create();

            logger.info("SMS sent successfully, SID: " + message_response.getSid());
        } catch (ApiException e) {
            logger.error("Twilio API exception sending SMS: " + e.getMessage() + ", Code: " + e.getCode() + ", Status: " + e.getStatusCode());
            throw new MessageSendException(e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error sending SMS: " + e.getMessage(), e);
            throw new MessageSendException(e.getMessage(), e);
        }
    }

    private void sendWhatsAppMessage(String phoneNumber, String message) throws MessageSendException {
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

            // Send the message
            Message message_response = creator.create();

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

            throw new MessageSendException("WhatsApp error: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.warn("WhatsApp general exception: " + e.getMessage());
            throw new MessageSendException("WhatsApp general exception: " + e.getMessage(), e);
        }
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
