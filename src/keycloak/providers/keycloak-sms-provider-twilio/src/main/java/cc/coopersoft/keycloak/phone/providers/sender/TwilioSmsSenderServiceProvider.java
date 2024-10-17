package cc.coopersoft.keycloak.phone.providers.sender;

import org.jboss.logging.Logger;
import org.keycloak.Config.Scope;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

import cc.coopersoft.keycloak.phone.providers.exception.MessageSendException;
import cc.coopersoft.keycloak.phone.providers.spi.FullSmsSenderAbstractService;

public class TwilioSmsSenderServiceProvider extends FullSmsSenderAbstractService {

    private static final Logger logger = Logger.getLogger(TwilioSmsSenderServiceProvider.class);
    private final Scope config;

    TwilioSmsSenderServiceProvider(Scope config, String realmDisplay) {
        super(realmDisplay);
        Twilio.init(config.get("account"), config.get("token"));
        this.config = config;
    }

    @Override
    public void sendMessage(String phoneNumber, String message) throws MessageSendException {

        // Parse the phone number
        var phoneNumberUtil = PhoneNumberUtil.getInstance();
        com.google.i18n.phonenumbers.Phonenumber.PhoneNumber _phoneNumber = null;
        try {
            _phoneNumber = phoneNumberUtil.parse(phoneNumber, null);
        } catch (NumberParseException ex) {
        }

        // Assume countryCode is the result from PhoneNumberUtil.getCountryCode()
        if (_phoneNumber == null) {
            throw new MessageSendException("Failed to parse phone number.", null);
        }
        String countryCode = "+" + _phoneNumber.getCountryCode();  // For example, +234 for Nigeria

        logger.info("countryCode: " + countryCode);

        // Get the Twilio phone number configuration
        String twilioPhoneNumberConfig = config.get("number");

        // Twilio phone number config is in the format: +27|600193536;+234|8031234567
        String[] twilioPhoneNumbers = twilioPhoneNumberConfig.split(";");

        // Loop through the numbers to find the matching country code
        String matchedTwilioPhoneNumber = null;
        for (String twilioPhoneNumber : twilioPhoneNumbers) {
            String[] twilioPhoneNumberParts = twilioPhoneNumber.split("\\|");
            if (twilioPhoneNumberParts[0].equals(countryCode)) {
                matchedTwilioPhoneNumber = twilioPhoneNumberParts[1];  // Set the Twilio phone number for the matching country code
                break;  // Exit the loop once the matching country is found
            }
        }

        if (matchedTwilioPhoneNumber == null) {
            throw new MessageSendException("No matching Twilio phone number found for the country code: " + countryCode, null);
        } else // append the country code to the Twilio phone number
        {
            matchedTwilioPhoneNumber = countryCode + matchedTwilioPhoneNumber;
        }

        try {
            Message msg = Message.creator(
                    new PhoneNumber(phoneNumber),
                    new PhoneNumber(matchedTwilioPhoneNumber),
                    message).create();
            if (msg.getStatus() == Message.Status.FAILED) {
                logger.error("Message send failed!");
                // Construct an error message
                String errorMsg = String.format("Message send failed with status: %s, error code: %s, error message: %s",
                        msg.getStatus(),
                        msg.getErrorCode(),
                        msg.getErrorMessage());
                // Throw the exception with the error message and no cause
                throw new MessageSendException(errorMsg, null);
            }
        } catch (Exception e) {
            // If an exception occurs, wrap it in MessageSendException
            String errorMsg = "Failed to send message due to an exception.";
            logger.error(errorMsg, e);
            throw new MessageSendException(errorMsg, e);
        }
    }

    @Override
    public void close() {
    }
}
