package cc.coopersoft.keycloak.phone.authentication.forms;

import java.util.ArrayList;
import java.util.List;

import org.jboss.logging.Logger;
import org.keycloak.Config;
import org.keycloak.authentication.FormAction;
import org.keycloak.authentication.FormActionFactory;
import org.keycloak.authentication.FormContext;
import org.keycloak.authentication.ValidationContext;
import org.keycloak.credential.CredentialProvider;
import org.keycloak.events.Details;
import org.keycloak.events.Errors;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.AuthenticationExecutionModel.Requirement;
import org.keycloak.models.AuthenticatorConfigModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.utils.FormMessage;
import org.keycloak.provider.ProviderConfigProperty;
import static org.keycloak.provider.ProviderConfigProperty.BOOLEAN_TYPE;
import org.keycloak.provider.ProviderConfigurationBuilder;
import org.keycloak.services.validation.Validation;

import cc.coopersoft.keycloak.phone.Utils;
import static cc.coopersoft.keycloak.phone.authentication.forms.SupportPhonePages.FIELD_PHONE_NUMBER;
import static cc.coopersoft.keycloak.phone.authentication.forms.SupportPhonePages.FIELD_VERIFICATION_CODE;
import cc.coopersoft.keycloak.phone.credential.PhoneOtpCredentialModel;
import cc.coopersoft.keycloak.phone.credential.PhoneOtpCredentialProvider;
import cc.coopersoft.keycloak.phone.credential.PhoneOtpCredentialProviderFactory;
import cc.coopersoft.keycloak.phone.providers.constants.TokenCodeType;
import cc.coopersoft.keycloak.phone.providers.exception.PhoneNumberInvalidException;
import cc.coopersoft.keycloak.phone.providers.representations.TokenCodeRepresentation;
import cc.coopersoft.keycloak.phone.providers.spi.PhoneVerificationCodeProvider;
import jakarta.ws.rs.core.MultivaluedMap;

public class RegistrationPhoneVerificationCode implements FormAction, FormActionFactory {

    private static final Logger logger = Logger.getLogger(RegistrationPhoneVerificationCode.class);

    public static final String PROVIDER_ID = "registration-phone";

    public static final String CONFIG_OPT_CREDENTIAL = "createOPTCredential";

    @Override
    public String getHelpText() {
        return "valid phone number and verification code";
    }

    @Override
    public boolean isUserSetupAllowed() {
        return false;
    }

    @Override
    public void close() {

    }

    @Override
    public String getDisplayType() {
        return "Phone validation";
    }

    @Override
    public String getReferenceCategory() {
        return null;
    }

    @Override
    public boolean isConfigurable() {
        return true;
    }

    protected static final List<ProviderConfigProperty> CONFIG_PROPERTIES;

    static {
        CONFIG_PROPERTIES = ProviderConfigurationBuilder.create()
                .property().name(CONFIG_OPT_CREDENTIAL)
                .type(BOOLEAN_TYPE)
                .defaultValue(false)
                .label("Create OTP Credential")
                .helpText("Create OTP credential by phone number.")
                .add()
                .build();
    }

    @Override
    public List<ProviderConfigProperty> getConfigProperties() {
        return CONFIG_PROPERTIES;
    }

    private final static Requirement[] REQUIREMENT_CHOICES = {
        Requirement.REQUIRED, Requirement.DISABLED};

    @Override
    public Requirement[] getRequirementChoices() {
        return REQUIREMENT_CHOICES;
    }

    @Override
    public FormAction create(KeycloakSession session) {
        return this;
    }

    @Override
    public void init(Config.Scope config) {

    }

    @Override
    public void postInit(KeycloakSessionFactory factory) {

    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    // FormAction
    private PhoneVerificationCodeProvider getTokenCodeService(KeycloakSession session) {
        return session.getProvider(PhoneVerificationCodeProvider.class);
    }

    @Override
    public void validate(ValidationContext context) {
        // Extract form data and initialize errors list
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();
        List<FormMessage> errors = new ArrayList<>();

        context.getEvent().detail(Details.REGISTER_METHOD, "form");

        // Get session and phone number from the form data
        KeycloakSession session = context.getSession();
        String phoneNumber = formData.getFirst(FIELD_PHONE_NUMBER);
        //String countryCode = formData.getFirst(FIELD_COUNTRY_CODE); // Retrieve country code

        // Log initial validation step for phone number
        logger.info("Validating phone number during registration: " + phoneNumber);

        // Check if phone number is blank
        if (!Validation.isBlank(phoneNumber)) {
            // // Concatenate country code and phone number
            // if (!Validation.isBlank(countryCode)) {
            //     phoneNumber = countryCode + phoneNumber;
            // }

            // Try to canonicalize the phone number
            try {
                // ensure phone number starts with +
                if (!phoneNumber.startsWith("+")) {
                    phoneNumber = "+" + phoneNumber;
                }

                phoneNumber = Utils.canonicalizePhoneNumber(context.getSession(), phoneNumber);
                logger.info("Canonicalized phone number: " + phoneNumber);
            } catch (PhoneNumberInvalidException e) {
                logger.error("Invalid phone number: " + phoneNumber + ", error: " + e.getMessage());
                context.error(Errors.INVALID_REGISTRATION);
                errors.add(new FormMessage(FIELD_PHONE_NUMBER, e.getErrorType().message()));
                context.validationError(formData, errors);
                return;
            }

            // Store the phone number in event details
            context.getEvent().detail(FIELD_PHONE_NUMBER, phoneNumber);

            // Retrieve the verification code from the form data
            String verificationCode = formData.getFirst(FIELD_VERIFICATION_CODE);
            logger.info("Verification code entered: " + verificationCode);

            // Retrieve ongoing token process based on the phone number
            TokenCodeRepresentation tokenCode = getTokenCodeService(session).ongoingProcess(phoneNumber, TokenCodeType.REGISTRATION);

            // Validate the verification code
            if (Validation.isBlank(verificationCode) || tokenCode == null || !tokenCode.getCode().equals(verificationCode)) {
                logger.warn("Verification code mismatch or not found for phone number: " + phoneNumber);
                context.error(Errors.INVALID_REGISTRATION);
                formData.remove(FIELD_VERIFICATION_CODE);
                errors.add(new FormMessage(FIELD_VERIFICATION_CODE, SupportPhonePages.Errors.NOT_MATCH.message()));
                context.validationError(formData, errors);
                return;
            }

            // Set the tokenId in the session once verification succeeds
            context.getSession().setAttribute("tokenId", tokenCode.getId());
            logger.info("Phone number verified successfully. Token ID stored in session: " + tokenCode.getId());
        }

        // Mark the context as successful
        context.success();
        logger.info("Validation completed successfully for phone number: " + phoneNumber);
    }

    @Override
    public void success(FormContext context) {
        UserModel user = context.getUser();
        var session = context.getSession();

        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();

        String phoneNumber = formData.getFirst(FIELD_PHONE_NUMBER);
        //String countryCode = formData.getFirst(FIELD_COUNTRY_CODE); // Retrieve country code

        if (Validation.isBlank(phoneNumber)) {
            return;
        }

        //  log the country code and phone number
        //logger.info(String.format("Country code: %s, Phone number: %s", countryCode, phoneNumber));
        // // Concatenate country code and phone number
        // if (!Validation.isBlank(countryCode)) {
        //     phoneNumber = countryCode + phoneNumber;
        // }
        // log full phone number
        logger.info(String.format("Full phone number: %s", phoneNumber));

        try {
            phoneNumber = Utils.canonicalizePhoneNumber(context.getSession(), phoneNumber);
        } catch (PhoneNumberInvalidException e) {
            // verified in validate process
            throw new IllegalStateException();
        }

        String tokenId = session.getAttribute("tokenId", String.class);

        logger.info(String.format("registration user %s phone success, tokenId is: %s", user.getId(), tokenId));
        getTokenCodeService(context.getSession()).tokenValidated(user, phoneNumber, tokenId, false);

        AuthenticatorConfigModel config = context.getAuthenticatorConfig();
        if (config != null
                && "true".equalsIgnoreCase(config.getConfig().getOrDefault(CONFIG_OPT_CREDENTIAL, "false"))) {
            PhoneOtpCredentialProvider ocp = (PhoneOtpCredentialProvider) context.getSession()
                    .getProvider(CredentialProvider.class, PhoneOtpCredentialProviderFactory.PROVIDER_ID);
            ocp.createCredential(context.getRealm(), context.getUser(), PhoneOtpCredentialModel.create(phoneNumber, tokenId, 0));
        }
    }

    @Override
    public void buildPage(FormContext context, LoginFormsProvider form) {
        form.setAttribute("verifyPhone", true);
    }

    @Override
    public boolean requiresUser() {
        return false;
    }

    @Override
    public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
        return true;
    }

    @Override
    public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {

    }
}
