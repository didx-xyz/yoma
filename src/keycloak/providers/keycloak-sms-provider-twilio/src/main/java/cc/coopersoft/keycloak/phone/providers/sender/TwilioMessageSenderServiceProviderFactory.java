package cc.coopersoft.keycloak.phone.providers.sender;

import org.jboss.logging.Logger;
import org.keycloak.Config;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;

import cc.coopersoft.keycloak.phone.providers.spi.MessageSenderService;
import cc.coopersoft.keycloak.phone.providers.spi.MessageSenderServiceProviderFactory;

public class TwilioMessageSenderServiceProviderFactory implements MessageSenderServiceProviderFactory {

    private static final Logger logger = Logger.getLogger(TwilioMessageSenderServiceProviderFactory.class);

    private String realmDisplayName;
    private String accountSID;
    private String authToken;
    private String fromNumber;
    private String whatsappFromNumber;
    private String whatsappAppHash;
    private String whatsappTemplateId;

    @Override
    public MessageSenderService create(KeycloakSession session) {
        return new TwilioSmsSenderServiceProvider(realmDisplayName, accountSID, authToken, fromNumber,
                whatsappFromNumber, whatsappAppHash, whatsappTemplateId);
    }

    @Override
    public void init(Config.Scope config) {
        realmDisplayName = config.get("realmDisplayName", "Yoma");

        // Try both camelCase and lowercase versions of configuration keys
        accountSID = getConfigValue(config, "twilioAccount", "account");
        authToken = getConfigValue(config, "twilioToken", "token");
        fromNumber = getConfigValue(config, "twilioNumber", "number");
        whatsappFromNumber = getConfigValue(config, "twilioWhatsappNumber", "whatsappNumber");
        whatsappAppHash = getConfigValue(config, "KC_SPI_MESSAGE_SENDER_SERVICE_TWILIO_WHATSAPP_APP_HASH", "twilioWhatsappAppHash", "whatsappAppHash");
        whatsappTemplateId = getConfigValue(config, "KC_SPI_MESSAGE_SENDER_SERVICE_TWILIO_WHATSAPP_TEMPLATE_ID", "twilioWhatsappTemplateId", "whatsappTemplateId");

        // Log only if critical configuration is missing
        if (accountSID == null || authToken == null || fromNumber == null) {
            logger.warn("Twilio is not fully configured! Some required parameters are missing.");
        }
    }

    // Helper method to try multiple configuration keys
    private String getConfigValue(Config.Scope config, String... keys) {
        for (String key : keys) {
            String value = config.get(key);
            if (value != null && !value.trim().isEmpty()) {
                logger.debug("Found configuration for key: " + key);
                return value;
            }
        }
        logger.debug("No configuration found for keys: " + String.join(", ", keys));
        return null;
    }

    @Override
    public void postInit(KeycloakSessionFactory factory) {
        // Nothing to do here
    }

    @Override
    public void close() {
        // Nothing to close
    }

    @Override
    public String getId() {
        return "twilio";
    }
}
