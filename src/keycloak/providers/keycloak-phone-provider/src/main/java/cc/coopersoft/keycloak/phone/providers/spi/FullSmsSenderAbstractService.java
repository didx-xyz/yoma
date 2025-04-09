package cc.coopersoft.keycloak.phone.providers.spi;

import java.text.MessageFormat;
import java.util.Locale;
import java.util.Optional;
import java.util.Properties;

import org.jboss.logging.Logger;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.UserModel;
import org.keycloak.theme.Theme;

import cc.coopersoft.keycloak.phone.Utils;
import cc.coopersoft.keycloak.phone.providers.constants.TokenCodeType;
import cc.coopersoft.keycloak.phone.providers.exception.MessageSendException;

public abstract class FullSmsSenderAbstractService implements MessageSenderService {

    private static final Logger logger = Logger.getLogger(FullSmsSenderAbstractService.class);

    private final String realmDisplay;

    private final KeycloakSession session;

    @Deprecated
    public FullSmsSenderAbstractService(String realmDisplay) {
        this.realmDisplay = realmDisplay;
        this.session = null;
    }

    public FullSmsSenderAbstractService(KeycloakSession session) {
        this.session = session;
        this.realmDisplay = session.getContext().getRealm().getDisplayName();
    }

    public abstract void sendMessage(String phoneNumber, String message) throws MessageSendException;

    @Override
    public void sendSmsMessage(TokenCodeType type, String phoneNumber, String code, int expires, String kind)
            throws MessageSendException {
        final String defaultMessage = String.format("%s: %s is your %s code. This code expires in %s minutes.",
                realmDisplay.toUpperCase(), code, type.label, expires / 60);
        final String MESSAGE = localizeMessage(type, phoneNumber, code, expires).orElse(defaultMessage);
        sendMessage(phoneNumber, MESSAGE);
    }

    /**
     * Localizes sms code message template from login theme.
     *
     * @param type the type of code sent
     * @param phoneNumber the user's phone number (if applicable)
     * @param code the verification code
     * @param expires code expiration in seconds
     * @return The localized string, else empty.
     */
    private Optional<String> localizeMessage(TokenCodeType type, String phoneNumber, String code, int expires) {
        if (this.session != null) {
            try {
                final String loginThemeName = session.getContext().getRealm().getLoginTheme();
                final Theme loginTheme = session.theme().getTheme(loginThemeName, Theme.Type.LOGIN);

                // Ensure user locale is set
                final Optional<UserModel> user = Utils.findUserByPhone(session, session.getContext().getRealm(), phoneNumber);
                final Optional<String> userLocale = user.map(u -> u.getFirstAttribute(UserModel.LOCALE));
                final String localeName = userLocale.orElseGet(() -> {
                    String realmLocale = session.getContext().getRealm().getDefaultLocale();
                    return (realmLocale != null && !realmLocale.isEmpty()) ? realmLocale : "en";
                });

                final Locale locale = Locale.forLanguageTag(localeName);
                final Properties messages = loginTheme.getMessages(locale);
                final String messageTemplate = messages.getProperty("smsCodeMessage", "");

                // Log if template is missing
                if (messageTemplate.isBlank()) {
                    logger.warn("smsCodeMessage key not found in theme bundle for locale: " + localeName);
                    return Optional.empty();
                }

                MessageFormat mf = new MessageFormat(messageTemplate, locale);
                return Optional.of(mf.format(new Object[]{realmDisplay, type.label, code, expires / 60}));
            } catch (Exception ex) {
                logger.error("Error while trying to localize message", ex);
                return Optional.empty();
            }
        }
        return Optional.empty();
    }
}
