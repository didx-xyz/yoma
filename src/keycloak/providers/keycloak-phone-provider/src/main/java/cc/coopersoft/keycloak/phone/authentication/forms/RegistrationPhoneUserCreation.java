package cc.coopersoft.keycloak.phone.authentication.forms;

import java.util.ArrayList;
import java.util.List;

import org.jboss.logging.Logger;
import org.keycloak.Config;
import org.keycloak.authentication.FormAction;
import org.keycloak.authentication.FormActionFactory;
import org.keycloak.authentication.FormContext;
import org.keycloak.authentication.ValidationContext;
import org.keycloak.events.Details;
import org.keycloak.events.Errors;
import org.keycloak.events.EventType;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.AuthenticationExecutionModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.utils.FormMessage;
import org.keycloak.protocol.oidc.OIDCLoginProtocol;
import org.keycloak.provider.ProviderConfigProperty;
import static org.keycloak.provider.ProviderConfigProperty.BOOLEAN_TYPE;
import org.keycloak.provider.ProviderConfigurationBuilder;
import org.keycloak.services.messages.Messages;
import org.keycloak.services.validation.Validation;
import org.keycloak.userprofile.UserProfile;
import org.keycloak.userprofile.UserProfileContext;
import org.keycloak.userprofile.UserProfileProvider;
import org.keycloak.userprofile.ValidationException;

import cc.coopersoft.keycloak.phone.Utils;
import static cc.coopersoft.keycloak.phone.authentication.forms.SupportPhonePages.FIELD_PHONE_NUMBER;
import cc.coopersoft.keycloak.phone.providers.exception.PhoneNumberInvalidException;
import jakarta.ws.rs.core.MultivaluedMap;

public class RegistrationPhoneUserCreation implements FormActionFactory, FormAction {

    private static final Logger logger = Logger.getLogger(RegistrationPhoneUserCreation.class);

    public static final String PROVIDER_ID = "registration-phone-username-creation";

    public static final String CONFIG_PHONE_NUMBER_AS_USERNAME = "phoneNumberAsUsername";

    public static final String CONFIG_INPUT_NAME = "isInputName";

    public static final String CONFIG_INPUT_EMAIL = "isInputEmail";
    private static final AuthenticationExecutionModel.Requirement[] REQUIREMENT_CHOICES = {
        AuthenticationExecutionModel.Requirement.REQUIRED, AuthenticationExecutionModel.Requirement.DISABLED};

    @Override
    public String getDisplayType() {
        return "Registration Phone User Creation";
    }

    @Override
    public String getHelpText() {
        return "This action must always be first And Do not use Email as username! registration phone number as username. In success phase, this will create the user in the database.";
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
                .property().name(CONFIG_PHONE_NUMBER_AS_USERNAME)
                .type(BOOLEAN_TYPE)
                .label("Phone number as username")
                .helpText("Allow users to set phone number as username. If Realm has `email as username` set to true, this is invalid!")
                .defaultValue(true)
                .add()
                .build();
    }

    @Override
    public AuthenticationExecutionModel.Requirement[] getRequirementChoices() {
        return REQUIREMENT_CHOICES;
    }

    @Override
    public boolean isUserSetupAllowed() {
        return false;
    }

    @Override
    public List<ProviderConfigProperty> getConfigProperties() {
        return CONFIG_PROPERTIES;
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
    public void close() {

    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    // FormAction
    private boolean isPhoneNumberAsUsername(FormContext context) {
        if (context.getAuthenticatorConfig() == null || "true".equals(context.getAuthenticatorConfig().getConfig()
                .getOrDefault(CONFIG_PHONE_NUMBER_AS_USERNAME, "true"))) {

            if (context.getRealm().isRegistrationEmailAsUsername()) {
                logger.warn("Realm set email as username, can't use phone number.");
                return false;
            }

            return true;
        }
        return false;
    }

    @Override
    public void buildPage(FormContext context, LoginFormsProvider form) {
        if (isPhoneNumberAsUsername(context)) {
            form.setAttribute("registrationPhoneNumberAsUsername", true);
        }

        // write out KC_HTTP_RELATIVE_PATH environment variable to the form
        String relativePath = "";
        String envRelativePath = System.getenv("KC_HTTP_RELATIVE_PATH");
        if (envRelativePath != null && !envRelativePath.isEmpty()) {
            relativePath = envRelativePath;
        }
        form.setAttribute("KC_HTTP_RELATIVE_PATH", relativePath);
    }

    @Override
    public void validate(ValidationContext context) {
        // Initialize session, form data, and errors list
        KeycloakSession session = context.getSession();
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();
        context.getEvent().detail(Details.REGISTER_METHOD, "form");
        String phoneNumber = formData.getFirst(FIELD_PHONE_NUMBER);
        String email = formData.getFirst(UserModel.EMAIL);
        boolean success = true;
        List<FormMessage> errors = new ArrayList<>();

        // Check if both phoneNumber and email are blank
        boolean isPhoneBlank = Validation.isBlank(phoneNumber);
        boolean isEmailBlank = Validation.isBlank(email);
        if (isPhoneBlank && isEmailBlank) {
            String errorMsg = "Either phone number or email must be specified.";
            errors.add(new FormMessage(FIELD_PHONE_NUMBER, errorMsg));
            errors.add(new FormMessage(UserModel.EMAIL, errorMsg));
            context.error(Errors.INVALID_REGISTRATION);
            success = false;
        } // If phone number is used as username, it must be specified
        else if (isPhoneNumberAsUsername(context) && isPhoneBlank) {
            String errorMsg = "Phone number must be specified when it is used as username.";
            errors.add(new FormMessage(FIELD_PHONE_NUMBER, errorMsg));
            context.error(Errors.INVALID_REGISTRATION);
            success = false;
        } // Validate phone number if it's provided
        else if (!isPhoneBlank) {
            try {
                // Ensure phone number starts with '+'
                if (!phoneNumber.startsWith("+")) {
                    phoneNumber = "+" + phoneNumber;
                }

                // Canonicalize phone number
                phoneNumber = Utils.canonicalizePhoneNumber(session, phoneNumber);

                // Check for duplicate phone numbers
                if (Utils.findUserByPhone(session, context.getRealm(), phoneNumber).isPresent()) {
                    errors.add(new FormMessage(FIELD_PHONE_NUMBER, SupportPhonePages.Errors.EXISTS.message()));
                    context.error(Errors.INVALID_REGISTRATION);
                    success = false;
                }
            } catch (PhoneNumberInvalidException e) {
                errors.add(new FormMessage(FIELD_PHONE_NUMBER, e.getErrorType().message()));
                context.error(Errors.INVALID_REGISTRATION);
                success = false;
            }
        }

        // Determine username based on provided information and settings
        String username;
        if (isPhoneNumberAsUsername(context)) {
            // Use phone number as username
            username = phoneNumber;
        } else if (!Validation.isBlank(email)) {
            // Use email as username if provided, else use phone number
            username = email;
        } else {
            username = phoneNumber;
        }

        // Set the username in form data and event details
        formData.putSingle(UserModel.USERNAME, username);
        context.getEvent().detail(Details.USERNAME, username);

        // Get user profile provider and create user profile
        UserProfileProvider profileProvider = session.getProvider(UserProfileProvider.class);
        UserProfile profile = profileProvider.create(UserProfileContext.REGISTRATION_USER_CREATION, formData);

        // Retrieve other attributes from the profile
        String emailFromProfile = profile.getAttributes().getFirstValue(UserModel.EMAIL);

        // Set event details
        context.getEvent().detail(Details.EMAIL, emailFromProfile);

        // Validate the profile
        try {
            profile.validate();
        } catch (ValidationException pve) {
            if (pve.hasError(Messages.EMAIL_EXISTS)) {
                context.error(Errors.EMAIL_IN_USE);
            } else if (pve.hasError(Messages.MISSING_EMAIL, Messages.MISSING_USERNAME, Messages.INVALID_EMAIL)) {
                context.error(Errors.INVALID_REGISTRATION);
            } else if (pve.hasError(Messages.USERNAME_EXISTS)) {
                context.error(Errors.USERNAME_IN_USE);
            }
            success = false;
            errors.addAll(Validation.getFormErrorsFromValidation(pve.getErrors()));
        }

        // If validation was successful, mark context as success
        if (success) {
            context.success();
        } else {
            // If validation failed, return errors
            context.validationError(formData, errors);
        }
    }

    @Override
    public void success(FormContext context) {
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();

        String phoneNumber = formData.getFirst(FIELD_PHONE_NUMBER);
        String email = formData.getFirst(UserModel.EMAIL);
        String username = formData.getFirst(UserModel.USERNAME); // Already set during validation

        var session = context.getSession();
        if (!Validation.isBlank(phoneNumber)) {

            try {
                // Canonicalize phone number again to ensure consistent format
                phoneNumber = Utils.canonicalizePhoneNumber(session, phoneNumber);
            } catch (PhoneNumberInvalidException e) {
                // Phone number was already validated during the validation process
                throw new IllegalStateException();
            }
        }

        // Add details to the event
        context.getEvent().detail(Details.USERNAME, username)
                .detail(Details.REGISTER_METHOD, "form")
                .detail(FIELD_PHONE_NUMBER, phoneNumber)
                .detail(Details.EMAIL, email); // Always set email

        // Create the user profile and set the user
        UserProfileProvider profileProvider = session.getProvider(UserProfileProvider.class);
        UserProfile profile = profileProvider.create(UserProfileContext.REGISTRATION_USER_CREATION, formData);
        UserModel user = profile.create();

        user.setEnabled(true);
        context.setUser(user);

        // Set additional session and event details
        context.getAuthenticationSession().setClientNote(OIDCLoginProtocol.LOGIN_HINT_PARAM, username);

        context.getEvent().user(user);
        context.getEvent().success();

        // Start a new login event
        context.newEvent().event(EventType.LOGIN);
        context.getEvent().client(context.getAuthenticationSession().getClient().getClientId())
                .detail(Details.REDIRECT_URI, context.getAuthenticationSession().getRedirectUri())
                .detail(Details.AUTH_METHOD, context.getAuthenticationSession().getProtocol());

        String authType = context.getAuthenticationSession().getAuthNote(Details.AUTH_TYPE);
        if (authType != null) {
            context.getEvent().detail(Details.AUTH_TYPE, authType);
        }

        // Logging the user creation info
        logger.info(String.format("User: %s is created, username is %s", user.getId(), user.getUsername()));
    }

    @Override
    public boolean requiresUser() {
        return false;
    }

    @Override
    public boolean configuredFor(KeycloakSession keycloakSession, RealmModel realmModel, UserModel userModel) {
        return true;//!realmModel.isRegistrationEmailAsUsername();
    }

    @Override
    public void setRequiredActions(KeycloakSession keycloakSession, RealmModel realmModel, UserModel userModel) {

    }
}
