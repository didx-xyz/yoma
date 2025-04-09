package cc.coopersoft.keycloak.phone.providers.spi.impl;

import java.time.Instant;
import java.util.Optional;

import org.jboss.logging.Logger;
import org.keycloak.Config.Scope;
import org.keycloak.models.KeycloakSession;
import org.keycloak.services.validation.Validation;

import cc.coopersoft.common.OptionalUtils;
import cc.coopersoft.keycloak.phone.providers.constants.TokenCodeType;
import cc.coopersoft.keycloak.phone.providers.exception.MessageSendException;
import cc.coopersoft.keycloak.phone.providers.representations.TokenCodeRepresentation;
import cc.coopersoft.keycloak.phone.providers.spi.MessageSenderService;
import cc.coopersoft.keycloak.phone.providers.spi.PhoneProvider;
import cc.coopersoft.keycloak.phone.providers.spi.PhoneVerificationCodeProvider;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ServiceUnavailableException;

public class DefaultPhoneProvider implements PhoneProvider {

    private static final Logger logger = Logger.getLogger(DefaultPhoneProvider.class);
    private final KeycloakSession session;
    private final String service;
    private final int tokenExpiresIn;
    private final int targetHourMaximum;
    private final int sourceHourMaximum;

    private final Scope config;

    DefaultPhoneProvider(KeycloakSession session, Scope config) {
        this.session = session;
        this.config = config;

        this.service = session.listProviderIds(MessageSenderService.class)
                .stream().filter(s -> s.equals(config.get("service")))
                .findFirst().orElse(
                        session.listProviderIds(MessageSenderService.class)
                                .stream().findFirst().orElse(null)
                );

        if (Validation.isBlank(this.service)) {
            logger.error("Message sender service provider not found!");
        }

        if (Validation.isBlank(config.get("service"))) {
            logger.warn("No message sender service provider specified! Default provider'"
                    + this.service + "' will be used. You can use keycloak start param '--spi-phone-default-service' to specify a different one. ");
        }

        this.tokenExpiresIn = config.getInt("tokenExpiresIn", 60);
        this.targetHourMaximum = config.getInt("targetHourMaximum", 3);
        this.sourceHourMaximum = config.getInt("sourceHourMaximum", 10);
    }

    @Override
    public void close() {
    }

    private PhoneVerificationCodeProvider getTokenCodeService() {
        return session.getProvider(PhoneVerificationCodeProvider.class);
    }

    private String getRealmName() {
        return session.getContext().getRealm().getName();
    }

    private Optional<String> getStringConfigValue(String configName) {
        return OptionalUtils.ofBlank(OptionalUtils.ofBlank(config.get(getRealmName() + "-" + configName))
                .orElse(config.get(configName)));
    }

    private boolean getBooleanConfigValue(String configName, boolean defaultValue) {
        Boolean result = config.getBoolean(getRealmName() + "-" + configName, null);
        if (result == null) {
            result = config.getBoolean(configName, defaultValue);
        }
        return result;
    }

    @Override
    public boolean isDuplicatePhoneAllowed() {
        return getBooleanConfigValue("duplicate-phone", false);
    }

    @Override
    public boolean validPhoneNumber() {
        return getBooleanConfigValue("valid-phone", true);
    }

    @Override
    public boolean compatibleMode() {
        return getBooleanConfigValue("compatible", false);
    }

    @Override
    public int otpExpires() {
        return getStringConfigValue("otp-expires").map(Integer::valueOf).orElse(60 * 60);
    }

    @Override
    public Optional<String> canonicalizePhoneNumber() {
        return getStringConfigValue("canonicalize-phone-numbers");
    }

    @Override
    public Optional<String> defaultPhoneRegion() {
        return getStringConfigValue("phone-default-region");
    }

    @Override
    public Optional<String> phoneNumberRegex() {
        return getStringConfigValue("number-regex");
    }

    @Override
    public int sendTokenCode(String phoneNumber, String sourceAddr, TokenCodeType type, String kind) {

        logger.info(String.format("Attempting to send %s code to phone: %s from source: %s",
                type.label, phoneNumber, sourceAddr != null ? sourceAddr : "unknown"));

        logger.debug(String.format("Checking abuse limits for %s - target hour max: %d, source hour max: %d",
                phoneNumber, targetHourMaximum, sourceHourMaximum));

        getTokenCodeService().isAbusing(phoneNumber, type, sourceAddr, sourceHourMaximum, targetHourMaximum);

        TokenCodeRepresentation ongoing = getTokenCodeService().ongoingProcess(phoneNumber, type);
        if (ongoing != null) {
            logger.info(String.format("Ongoing %s code already exists for %s, expires in %d seconds",
                    type.label, phoneNumber,
                    (int) ((ongoing.getExpiresAt().getTime() - Instant.now().toEpochMilli()) / 1000)));

            int expiryTime = (int) ((ongoing.getExpiresAt().getTime() - Instant.now().toEpochMilli()) / 1000);

            // We have already sent an OTP to {0}, use this pin, or wait {1} before requesting a new one.
            throw new BadRequestException(String.format("ALREADY_SENT Expiry: %d", expiryTime));
        }

        TokenCodeRepresentation token = TokenCodeRepresentation.forPhoneNumber(phoneNumber);
        logger.debug(String.format("Generated new token code for %s with expiry of %d seconds", phoneNumber, tokenExpiresIn));

        try {
            logger.debug(String.format("Using message service: %s to send %s code", service, type.label));
            session.getProvider(MessageSenderService.class, service).sendSmsMessage(type, phoneNumber, token.getCode(), tokenExpiresIn, kind);
            getTokenCodeService().persistCode(token, type, tokenExpiresIn);

            logger.info(String.format("Successfully sent %s code to %s using service: %s (expires in %d seconds)",
                    type.label, phoneNumber, service, tokenExpiresIn));

        } catch (MessageSendException e) {
            logger.error(String.format("Failed to send %s code to %s: %s", type.label, phoneNumber, e.getMessage()), e);
            throw new ServiceUnavailableException(e.getMessage());
        }

        return tokenExpiresIn;
    }
}
