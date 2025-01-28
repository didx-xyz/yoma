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
import org.keycloak.sessions.AuthenticationSessionModel;

import cc.coopersoft.keycloak.phone.Utils;
import static cc.coopersoft.keycloak.phone.authentication.forms.SupportPhonePages.FIELD_PHONE_NUMBER;
import static cc.coopersoft.keycloak.phone.authentication.forms.SupportPhonePages.FIELD_SMS_CODE_EXPIRES_IN;
import static cc.coopersoft.keycloak.phone.authentication.forms.SupportPhonePages.FIELD_SMS_CODE_SEND_STATUS;
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
        AuthenticationSessionModel authSession = context.getAuthenticationSession();
        String phoneNumber = formData.getFirst(FIELD_PHONE_NUMBER);

        // Check if phone number is blank
        if (Validation.isBlank(phoneNumber)) {
            authSession.setAuthNote("phoneVerified", "false");
            authSession.setAuthNote("verifiedPhoneNumber", null);
            context.success();
            return;
        }

        // Check if phone number is different from previously verified phone number
        String verifiedPhoneNumber = authSession.getAuthNote("verifiedPhoneNumber");
        if (!phoneNumber.equals(verifiedPhoneNumber)) {
            authSession.setAuthNote("phoneVerified", "false");
            authSession.setAuthNote("verifiedPhoneNumber", null);
        }

        // Validate phone number
        if (!validatePhoneNumber(context, session, authSession, phoneNumber, errors, formData)) {
            authSession.setAuthNote("phoneVerified", "false");
            authSession.setAuthNote("verifiedPhoneNumber", null);
            return;
        }

        // Validate verification code if phone is not verified
        if (!Boolean.parseBoolean(authSession.getAuthNote("phoneVerified")) && !validateVerificationCode(context, session, authSession, phoneNumber, errors, formData)) {
            authSession.setAuthNote("phoneVerified", "false");
            authSession.setAuthNote("verifiedPhoneNumber", null);
            return;
        }

        // Mark the context as successful
        context.success();
    }

    private boolean validatePhoneNumber(ValidationContext context, KeycloakSession session, AuthenticationSessionModel authSession, String phoneNumber, List<FormMessage> errors, MultivaluedMap<String, String> formData) {
        try {
            if (!phoneNumber.startsWith("+")) {
                phoneNumber = "+" + phoneNumber;
            }
            phoneNumber = Utils.canonicalizePhoneNumber(session, phoneNumber);
        } catch (PhoneNumberInvalidException e) {
            context.error(Errors.INVALID_REGISTRATION);
            errors.add(new FormMessage(FIELD_PHONE_NUMBER, e.getErrorType().message()));
            context.validationError(formData, errors);
            return false;
        }

        context.getEvent().detail(FIELD_PHONE_NUMBER, phoneNumber);
        authSession.setAuthNote("verifiedPhoneNumber", phoneNumber);
        return true;
    }

    private boolean validateVerificationCode(ValidationContext context, KeycloakSession session, AuthenticationSessionModel authSession, String phoneNumber, List<FormMessage> errors, MultivaluedMap<String, String> formData) {
        String verificationCode = formData.getFirst(FIELD_VERIFICATION_CODE);

        TokenCodeRepresentation tokenCode = getTokenCodeService(session).ongoingProcess(phoneNumber, TokenCodeType.REGISTRATION);
        if (Validation.isBlank(verificationCode) || tokenCode == null || !tokenCode.getCode().equals(verificationCode)) {
            context.error(Errors.INVALID_REGISTRATION);
            formData.remove(FIELD_VERIFICATION_CODE);
            errors.add(new FormMessage(FIELD_VERIFICATION_CODE, SupportPhonePages.Errors.NOT_MATCH.message()));
            context.validationError(formData, errors);
            return false;
        }

        authSession.setAuthNote("tokenId", tokenCode.getId());
        authSession.setAuthNote("phoneVerified", "true");
        authSession.setAuthNote("verifiedPhoneNumber", phoneNumber);
        return true;
    }

    @Override
    public void buildPage(FormContext context, LoginFormsProvider form) {
        AuthenticationSessionModel authSession = context.getAuthenticationSession();
        boolean phoneVerified = Boolean.parseBoolean(authSession.getAuthNote("phoneVerified"));

        // Extract form data and initialize errors list
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();

        // Retrieve the phone number from the form
        String phoneNumber = formData.getFirst(FIELD_PHONE_NUMBER);

        // Retrieve the verified phone number from the authentication session
        String verifiedPhoneNumber = authSession.getAuthNote("verifiedPhoneNumber");

        // Check if the phone numbers match
        if (phoneNumber == null || !phoneNumber.equals(verifiedPhoneNumber)) {
            phoneVerified = false;
            authSession.setAuthNote("verifiedPhoneNumber", null);
        }

        form.setAttribute("verifyPhone", true);
        form.setAttribute("phoneVerified", phoneVerified);

        // Retrieve 'codeSendStatus' from form data
        String codeSendStatus = formData.getFirst(FIELD_SMS_CODE_SEND_STATUS);
        if (codeSendStatus == null) {
            codeSendStatus = "NOT_SENT";
        }

        // Set 'codeSendStatus' as a form attribute
        form.setAttribute(FIELD_SMS_CODE_SEND_STATUS, codeSendStatus);

        // Set expires time if code was sent
        if ("SENT".equals(codeSendStatus) || "ALREADY_SENT".equals(codeSendStatus)) {
            String expiresIn = formData.getFirst(FIELD_SMS_CODE_EXPIRES_IN);
            if (expiresIn != null) {
                form.setAttribute(FIELD_SMS_CODE_EXPIRES_IN, expiresIn);
            }
        }
    }

    @Override
    public void success(FormContext context) {
        UserModel user = context.getUser();
        AuthenticationSessionModel authSession = context.getAuthenticationSession();

        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();

        String phoneNumber = formData.getFirst(FIELD_PHONE_NUMBER);

        if (Validation.isBlank(phoneNumber)) {
            return;
        }

        try {
            phoneNumber = Utils.canonicalizePhoneNumber(context.getSession(), phoneNumber);
        } catch (PhoneNumberInvalidException e) {
            // verified in validate process
            throw new IllegalStateException();
        }
        String tokenId = authSession.getAuthNote("tokenId");

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
