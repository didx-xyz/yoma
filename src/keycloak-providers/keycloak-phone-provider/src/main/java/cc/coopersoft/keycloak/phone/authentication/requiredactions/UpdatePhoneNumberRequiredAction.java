package cc.coopersoft.keycloak.phone.authentication.requiredactions;

import cc.coopersoft.keycloak.phone.Utils;
import cc.coopersoft.keycloak.phone.authentication.forms.SupportPhonePages;
import cc.coopersoft.keycloak.phone.providers.exception.PhoneNumberInvalidException;
import cc.coopersoft.keycloak.phone.providers.spi.PhoneVerificationCodeProvider;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.core.Response;

import org.keycloak.authentication.RequiredActionContext;
import org.keycloak.authentication.RequiredActionProvider;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.UserModel;
import org.keycloak.services.validation.Validation;
import org.keycloak.userprofile.UserProfile;
import org.keycloak.userprofile.UserProfileProvider;

public class UpdatePhoneNumberRequiredAction implements RequiredActionProvider {

    public static final String PROVIDER_ID = "UPDATE_PHONE_NUMBER";

    @Override
    public void evaluateTriggers(RequiredActionContext context) {
    }

    @Override
    public void requiredActionChallenge(RequiredActionContext context) {
        Response challenge = context.form()
                .createForm("login-update-phone-number.ftl");
        context.challenge(challenge);
    }

    @Override
    public void processAction(RequiredActionContext context) {
        PhoneVerificationCodeProvider phoneVerificationCodeProvider = context.getSession().getProvider(PhoneVerificationCodeProvider.class);
        String phoneNumber = context.getHttpRequest().getDecodedFormParameters().getFirst(SupportPhonePages.FIELD_PHONE_NUMBER);
        String code = context.getHttpRequest().getDecodedFormParameters().getFirst(SupportPhonePages.FIELD_VERIFICATION_CODE);

        // Extract the email from the user profile
        String email = context.getUser().getEmail();

        KeycloakSession session = context.getSession();

        try {
            // Canonicalize phone number
            phoneNumber = Utils.canonicalizePhoneNumber(context.getSession(), phoneNumber);

            // Check for duplicate phone numbers
            if (Utils.findUserByPhone(session, context.getRealm(), phoneNumber).isPresent()) {
                // Handle duplicate phone number
                Response challenge = context.form()
                        .setAttribute("phoneNumber", phoneNumber)
                        .setError(SupportPhonePages.Errors.EXISTS.message())
                        .createForm("login-update-phone-number.ftl");
                context.challenge(challenge);
                return;
            }

            // Validate the verification code
            phoneVerificationCodeProvider.validateCode(context.getUser(), phoneNumber, code);

            // If email is blank, set the username to the phone number
            if (Validation.isBlank(email)) {
                UserModel user = context.getUser();
                user.setUsername(phoneNumber);
            }

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
