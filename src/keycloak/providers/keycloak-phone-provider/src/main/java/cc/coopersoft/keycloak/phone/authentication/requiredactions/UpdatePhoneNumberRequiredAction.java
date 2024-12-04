package cc.coopersoft.keycloak.phone.authentication.requiredactions;

import org.keycloak.authentication.RequiredActionContext;
import org.keycloak.authentication.RequiredActionProvider;
import org.keycloak.events.EventType;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakTransaction;
import org.keycloak.models.UserModel;
import org.keycloak.services.validation.Validation;

import cc.coopersoft.keycloak.phone.Utils;
import cc.coopersoft.keycloak.phone.authentication.forms.SupportPhonePages;
import cc.coopersoft.keycloak.phone.providers.exception.PhoneNumberInvalidException;
import cc.coopersoft.keycloak.phone.providers.spi.PhoneVerificationCodeProvider;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.core.Response;

public class UpdatePhoneNumberRequiredAction implements RequiredActionProvider {

    public static final String PROVIDER_ID = "UPDATE_PHONE_NUMBER";

    @Override
    public void evaluateTriggers(RequiredActionContext context) {
    }

    @Override
    public void requiredActionChallenge(RequiredActionContext context) {
        // Write out KC_HTTP_RELATIVE_PATH environment variable to the form (for client side requests)
        String relativePath = "";
        String envRelativePath = System.getenv("KC_HTTP_RELATIVE_PATH");
        if (envRelativePath != null && !envRelativePath.isEmpty()) {
            relativePath = envRelativePath;
        }

        Response challenge = context.form()
                .setAttribute("KC_HTTP_RELATIVE_PATH", relativePath)
                .createForm("login-update-phone-number.ftl");
        context.challenge(challenge);
    }

    @Override
    public void processAction(RequiredActionContext context) {
        // check if we should cancel this action
        String cancelParam = context.getHttpRequest().getDecodedFormParameters().getFirst(SupportPhonePages.FIELD_CANCEL);
        if (cancelParam != null && Boolean.parseBoolean(cancelParam)) {
            context.getUser().removeRequiredAction(PROVIDER_ID);
            context.success();
            return;
        }

        PhoneVerificationCodeProvider phoneVerificationCodeProvider = context.getSession().getProvider(PhoneVerificationCodeProvider.class);
        String phoneNumber = context.getHttpRequest().getDecodedFormParameters().getFirst(SupportPhonePages.FIELD_PHONE_NUMBER);
        String code = context.getHttpRequest().getDecodedFormParameters().getFirst(SupportPhonePages.FIELD_VERIFICATION_CODE);

        // Extract the email from the user profile
        String email = context.getUser().getEmail();
        // get user's current phone number
        String currentPhoneNumber = context.getUser().getFirstAttribute("phoneNumber");

        KeycloakSession session = context.getSession();

        try {
            // Canonicalize phone number
            final String canonicalPhoneNumber = Utils.canonicalizePhoneNumber(context.getSession(), phoneNumber);

            // Check for duplicate phone numbers if user's phone number has changed
            if (!canonicalPhoneNumber.equals(currentPhoneNumber) && Utils.findUserByPhone(session, context.getRealm(), canonicalPhoneNumber).isPresent()) {
                // Handle duplicate phone number
                Response challenge = context.form()
                        .setAttribute("phoneNumber", canonicalPhoneNumber)
                        .setError(SupportPhonePages.Errors.EXISTS.message())
                        .createForm("login-update-phone-number.ftl");
                context.challenge(challenge);
                return;
            }

            // Validate the verification code
            phoneVerificationCodeProvider.validateCode(context.getUser(), canonicalPhoneNumber, code);

            // If email is blank, set the username to the phone number
            if (Validation.isBlank(email)) {
                UserModel user = context.getUser();
                user.setUsername(canonicalPhoneNumber);
            }

            // Register a transaction listener to fire the UPDATE_PROFILE event after the transaction is committed
            // Get the KeycloakTransactionManager and register the transaction completion listener
            session.getTransactionManager().enlistAfterCompletion(new KeycloakTransaction() {
                @Override
                public void begin() {
                    // Optional: No action required at the beginning of the transaction
                }

                @Override
                public void commit() {

                    // Fire the UPDATE_PROFILE event after the transaction is committed
                    context.getEvent().event(EventType.UPDATE_PROFILE)
                            .client(context.getAuthenticationSession().getClient())
                            .user(context.getUser())
                            .realm(context.getRealm())
                            .detail("updated_phone_number", canonicalPhoneNumber) // Add any relevant details
                            .success();
                }

                @Override
                public void rollback() {
                    // Optional: handle rollback if necessary
                }

                @Override
                public void setRollbackOnly() {
                    // Optional: handle rollback-only case
                }

                @Override
                public boolean getRollbackOnly() {
                    return false;
                }

                @Override
                public boolean isActive() {
                    return true;
                }
            });

            context.success();
        } catch (BadRequestException e) {
            // Handle bad request
            Response challenge = context.form()
                    .setError(SupportPhonePages.Errors.NO_PROCESS.message())
                    .createForm("login-update-phone-number.ftl");
            context.challenge(challenge);

        } catch (ForbiddenException e) {
            // Handle forbidden error (wrong code)
            Response challenge = context.form()
                    .setAttribute("phoneNumber", phoneNumber)
                    .setError(SupportPhonePages.Errors.NOT_MATCH.message())
                    .createForm("login-update-phone-number.ftl");
            context.challenge(challenge);

        } catch (PhoneNumberInvalidException e) {
            // Handle invalid phone number
            Response challenge = context.form()
                    .setAttribute("phoneNumber", phoneNumber)
                    .setError(e.getErrorType().message())
                    .createForm("login-update-phone-number.ftl");
            context.challenge(challenge);
        }
    }

    @Override
    public void close() {
    }
}
