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

/**
 * replace org.keycloak.authentication.forms.RegistrationUserCreation.java
 */
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
                .property().name(CONFIG_INPUT_NAME)
                .type(BOOLEAN_TYPE)
                .label("Input name")
                .helpText("Allow users to input first and last name.")
                .defaultValue(true)
                .add()
                .property().name(CONFIG_INPUT_EMAIL)
                .type(BOOLEAN_TYPE)
                .label("Input Email")
                .helpText("Allow users to input e-mail. If Realm has `email as username` set to true, this is invalid!")
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
            if (Utils.isDuplicatePhoneAllowed(context.getSession())) {
                logger.warn("Duplicate phone allowed! phone number can't be used as username.");
                return false;
            }
            return true;
        }
        return false;
    }

    private boolean isHideName(FormContext context) {
        return context.getAuthenticatorConfig() == null
                || !"true".equalsIgnoreCase(context.getAuthenticatorConfig().getConfig()
                        .getOrDefault(CONFIG_INPUT_NAME, "true"));
    }

    private boolean isHideEmail(FormContext context) {
        if (context.getAuthenticatorConfig() == null
                || "true".equalsIgnoreCase(context.getAuthenticatorConfig().getConfig()
                        .getOrDefault(CONFIG_INPUT_EMAIL, "true"))) {
            return false;
        }
        if (context.getRealm().isRegistrationEmailAsUsername()) {
            logger.warn("`email as username` is set, so can't hide email input.");
            return false;
        }

        return true;
    }

    @Override
    public void buildPage(FormContext context, LoginFormsProvider form) {

        form.setAttribute("phoneNumberRequired", true);

        if (isPhoneNumberAsUsername(context)) {
            form.setAttribute("registrationPhoneNumberAsUsername", true);
        }

        if (isHideName(context)) {
            form.setAttribute("hideName", true);
        }

        if (isHideEmail(context)) {
            form.setAttribute("hideEmail", true);
        }
    }

    @Override
    public void validate(ValidationContext context) {
        // Initialize session, form data, and errors list
        KeycloakSession session = context.getSession();
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();
        context.getEvent().detail(Details.REGISTER_METHOD, "form");
        String phoneNumber = formData.getFirst(FIELD_PHONE_NUMBER);

        boolean success = true;
        List<FormMessage> errors = new ArrayList<>();
        // Log the start of the validation process
        logger.info("Starting validation for phone number: " + phoneNumber);
        // Check if the phone number is blank
        if (Validation.isBlank(phoneNumber)) {
            logger.warn("Phone number is missing.");
            errors.add(new FormMessage(FIELD_PHONE_NUMBER, SupportPhonePages.Errors.MISSING.message()));
            context.error(Errors.INVALID_REGISTRATION);
            context.validationError(formData, errors);
            success = false;
        } else {
            try {
                // ensure phone number starts with +
                if (!phoneNumber.startsWith("+")) {
                    phoneNumber = "+" + phoneNumber;
                }

                // Canonicalize phone number
                phoneNumber = Utils.canonicalizePhoneNumber(session, phoneNumber);
                logger.info("Canonicalized phone number: " + phoneNumber);

                // Check if duplicate phone numbers are allowed
                if (!Utils.isDuplicatePhoneAllowed(session)
                        && Utils.findUserByPhone(session, context.getRealm(), phoneNumber).isPresent()) {
                    logger.warn("Phone number already exists: " + phoneNumber);
                    context.error(Errors.INVALID_REGISTRATION);
                    errors.add(new FormMessage(FIELD_PHONE_NUMBER, SupportPhonePages.Errors.EXISTS.message()));
                    context.validationError(formData, errors);
                    success = false;
                }
            } catch (PhoneNumberInvalidException e) {
                logger.error("Phone number is invalid: " + phoneNumber, e);
                context.error(Errors.INVALID_REGISTRATION);
                errors.add(new FormMessage(FIELD_PHONE_NUMBER, e.getErrorType().message()));
                context.validationError(formData, errors);
                success = false;
            }
        }

        // Add phone number to event details
        context.getEvent().detail(FIELD_PHONE_NUMBER, phoneNumber);

        // Set phone number as username if applicable
        if (isPhoneNumberAsUsername(context)) {
            logger.info("Setting phone number as username: " + phoneNumber);
            context.getEvent().detail(Details.USERNAME, phoneNumber);
            formData.putSingle(UserModel.USERNAME, phoneNumber);
        }

        // Get user profile provider and create user profile
        UserProfileProvider profileProvider = session.getProvider(UserProfileProvider.class);
        UserProfile profile = profileProvider.create(UserProfileContext.REGISTRATION_USER_CREATION, formData);

        // Retrieve the username from the profile
        String username = profile.getAttributes().getFirstValue(UserModel.USERNAME);
        logger.info("Username set from profile: " + username);
        context.getEvent().detail(Details.USERNAME, username);

        // Check for hidden fields: name and email
        boolean hideName = isHideName(context);
        boolean hideEmail = isHideEmail(context);

        // If name is not hidden, set first name and last name
        if (!hideName) {
            String firstName = profile.getAttributes().getFirstValue(UserModel.FIRST_NAME);
            String lastName = profile.getAttributes().getFirstValue(UserModel.LAST_NAME);
            logger.info("First name: " + firstName + ", Last name: " + lastName);
            context.getEvent().detail(Details.FIRST_NAME, firstName);
            context.getEvent().detail(Details.LAST_NAME, lastName);
        }

        // If email is not hidden, set email and potentially username
        if (!hideEmail) {
            String email = profile.getAttributes().getFirstValue(UserModel.EMAIL);
            logger.info("Email set from profile: " + email);
            context.getEvent().detail(Details.EMAIL, email);
            if (context.getRealm().isRegistrationEmailAsUsername()) {
                context.getEvent().detail(Details.USERNAME, email);
            }
        }

        // Validate the profile
        try {
            profile.validate();
            logger.info("Profile validated successfully.");
        } catch (ValidationException pve) {
            logger.error("Profile validation error.", pve);
            if (pve.hasError(Messages.EMAIL_EXISTS)) {
                logger.warn("Email already in use.");
                context.error(Errors.EMAIL_IN_USE);
            } else if (pve.hasError(Messages.MISSING_EMAIL, Messages.MISSING_USERNAME, Messages.INVALID_EMAIL)) {
                logger.warn("Invalid or missing email/username.");
                context.error(Errors.INVALID_REGISTRATION);
            } else if (pve.hasError(Messages.USERNAME_EXISTS)) {
                logger.warn("Username already exists.");
                context.error(Errors.USERNAME_IN_USE);
            }
            success = false;
            errors.addAll(Validation.getFormErrorsFromValidation(pve.getErrors()));
        }

        // If validation was successful, mark context as success
        if (success) {
            logger.info("User registration validation passed.");
            context.success();
        } else {
            // If validation failed, return errors
            logger.warn("Validation failed with errors.");
            context.validationError(formData, errors);
        }
    }

    @Override
    public void success(FormContext context) {

        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();

        String phoneNumber = formData.getFirst(FIELD_PHONE_NUMBER);
        String email = formData.getFirst(UserModel.EMAIL);
        String username = formData.getFirst(UserModel.USERNAME);

        var session = context.getSession();
        try {
            phoneNumber = Utils.canonicalizePhoneNumber(session, phoneNumber);
        } catch (PhoneNumberInvalidException e) {
            // verified in validate process
            throw new IllegalStateException();
        }

        if (context.getRealm().isRegistrationEmailAsUsername()) {
            username = email;
        } else if (isPhoneNumberAsUsername(context)) {
            username = phoneNumber;
            formData.add(UserModel.USERNAME, phoneNumber);
        }

        context.getEvent().detail(Details.USERNAME, username)
                .detail(Details.REGISTER_METHOD, "form")
                .detail(FIELD_PHONE_NUMBER, phoneNumber);

        if (!isHideEmail(context)) {
            context.getEvent().detail(Details.EMAIL, email);
        }

        UserProfileProvider profileProvider = session.getProvider(UserProfileProvider.class);
        UserProfile profile = profileProvider.create(UserProfileContext.REGISTRATION_USER_CREATION, formData);
        UserModel user = profile.create();

//    UserModel user = context.getSession().users().addUser(context.getRealm(), username);
        user.setEnabled(true);
        context.setUser(user);

        context.getAuthenticationSession().setClientNote(OIDCLoginProtocol.LOGIN_HINT_PARAM, username);
        //AttributeFormDataProcessor.process(formData);

        context.getEvent().user(user);
        context.getEvent().success();
        context.newEvent().event(EventType.LOGIN);
        context.getEvent().client(context.getAuthenticationSession().getClient().getClientId())
                .detail(Details.REDIRECT_URI, context.getAuthenticationSession().getRedirectUri())
                .detail(Details.AUTH_METHOD, context.getAuthenticationSession().getProtocol());
        String authType = context.getAuthenticationSession().getAuthNote(Details.AUTH_TYPE);
        if (authType != null) {
            context.getEvent().detail(Details.AUTH_TYPE, authType);
        }

        logger.info(String.format("user: %s is created, user name is %s ", user.getId(), user.getUsername()));
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
