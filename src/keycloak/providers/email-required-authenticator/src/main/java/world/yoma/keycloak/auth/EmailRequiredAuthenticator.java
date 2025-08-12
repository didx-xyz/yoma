package world.yoma.keycloak.auth;

import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.AuthenticationFlowError;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.authenticators.broker.AbstractIdpAuthenticator;
import org.keycloak.authentication.authenticators.broker.util.SerializedBrokeredIdentityContext;
import org.keycloak.broker.provider.BrokeredIdentityContext;
import org.keycloak.sessions.AuthenticationSessionModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.ws.rs.core.Response;

public class EmailRequiredAuthenticator implements Authenticator {

    private static final Logger LOG = LoggerFactory.getLogger(EmailRequiredAuthenticator.class);

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        AuthenticationSessionModel authSession = context.getAuthenticationSession();

        // Only enforce during brokered login.
        SerializedBrokeredIdentityContext serialized
                = SerializedBrokeredIdentityContext.readFromAuthenticationSession(authSession, AbstractIdpAuthenticator.BROKERED_CONTEXT_NOTE);
        if (serialized == null) {
            context.success();
            return;
        }

        BrokeredIdentityContext brokerCtx = serialized.deserialize(context.getSession(), authSession);
        String email = brokerCtx.getEmail();
        boolean hasEmail = email != null && !email.trim().isEmpty();

        if (!hasEmail) {
            LOG.warn("Brokered login: missing email from IdP; blocking first-broker-login.");
            Response challenge = context.form()
                    .setError("Facebook did not provide an email. Please allow email permission and try again.")
                    .createErrorPage(Response.Status.BAD_REQUEST);
            context.failureChallenge(AuthenticationFlowError.INVALID_USER, challenge);
            return;
        }

        context.success();
    }

    @Override
    public void action(AuthenticationFlowContext context) {
        /* no-op */ }

    @Override
    public boolean requiresUser() {
        return false;
    }

    @Override
    public boolean configuredFor(org.keycloak.models.KeycloakSession session, org.keycloak.models.RealmModel realm, org.keycloak.models.UserModel user) {
        return true;
    }

    @Override
    public void setRequiredActions(org.keycloak.models.KeycloakSession session, org.keycloak.models.RealmModel realm, org.keycloak.models.UserModel user) {
    }

    @Override
    public void close() {
    }

    private static String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "null";
        }
        int at = email.indexOf('@');
        if (at <= 1) {
            return "***" + (at >= 0 ? email.substring(at) : "");
        }
        String local = email.substring(0, at);
        String domain = email.substring(at);
        return local.charAt(0) + "***" + domain;
    }
}
