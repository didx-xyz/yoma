package cc.coopersoft.keycloak.phone.authentication.authenticators.directgrant;

import cc.coopersoft.keycloak.phone.Utils;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.keycloak.authentication.AuthenticationFlowContext;
import static org.keycloak.authentication.authenticators.util.AuthenticatorUtils.getDisabledByBruteForceEventError;
import org.keycloak.events.Errors;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;

public class PhoneNumberAuthenticator extends BaseDirectGrantAuthenticator {

    private static final Logger logger = Logger.getLogger(PhoneNumberAuthenticator.class);

    @Override
    public boolean requiresUser() {
        return false;
    }

    @Override
    public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {
    }

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        context.clearUser();
        getPhoneNumber(context).ifPresentOrElse(phoneNumber ->
            Utils.findUserByPhone(context.getSession(),context.getRealm(),phoneNumber)
                .ifPresentOrElse(user -> {
                    // As direct-grant-validate-username does: lockout and disabled accounts are
                    // rejected here, before the code authenticator consumes a code
                    String bruteForceError = getDisabledByBruteForceEventError(context, user);
                    if (bruteForceError != null) {
                        context.getEvent().user(user);
                        context.getEvent().error(bruteForceError);
                        context.forceChallenge(errorResponse(Response.Status.UNAUTHORIZED.getStatusCode(), "invalid_grant", "Invalid user credentials"));
                        return;
                    }
                    if (!user.isEnabled()) {
                        context.getEvent().user(user);
                        context.getEvent().error(Errors.USER_DISABLED);
                        context.forceChallenge(errorResponse(Response.Status.UNAUTHORIZED.getStatusCode(), "invalid_grant", "Invalid user credentials"));
                        return;
                    }
                    context.setUser(user);
                    context.success();
                },()->invalidCredentials(context)),() -> invalidCredentials(context));
    }
}
