package cc.coopersoft.keycloak.phone.authentication.authenticators.resetcred;

import org.jboss.logging.Logger;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.authenticators.resetcred.ResetCredentialEmail;
import org.keycloak.models.AuthenticationExecutionModel.Requirement;

public class ResetCredentialEmailWithPhone extends ResetCredentialEmail {

    public static final Requirement[] REQUIREMENT_CHOICES;

    private static final Logger logger = Logger.getLogger(ResetCredentialEmail.class);

    //TODO Requirement.CONDITIONAL or ALTERNATIVE ? configuredFor
    /**
     * REQUIRED ignore configuredFor always execute ALTERNATIVE same level multi
     * item check configuredFor choice one CONDITIONAL check condition item And
     * check configuredFor DISABLED ignore all
     */
    static {
        REQUIREMENT_CHOICES = new Requirement[]{
            Requirement.CONDITIONAL,
            Requirement.ALTERNATIVE,
            Requirement.DISABLED
        };
    }

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        // Write out KC_HTTP_RELATIVE_PATH environment variable to the form (for client side requests)
        String relativePath = "";
        String envRelativePath = System.getenv("KC_HTTP_RELATIVE_PATH");
        if (envRelativePath != null && !envRelativePath.isEmpty()) {
            relativePath = envRelativePath;
        }
        var form = context.form();
        form.setAttribute("KC_HTTP_RELATIVE_PATH", relativePath);

        if (context.getExecution().isRequired()
                || (context.getExecution().isConditional()
                && configuredFor(context))) {
            super.authenticate(context);
        } else {
            context.success();
        }
    }

    protected boolean configuredFor(AuthenticationFlowContext context) {
        String sendNote = context.getAuthenticationSession().getAuthNote(ResetCredentialWithPhone.SHOULD_SEND_EMAIL);
        return !"false".equalsIgnoreCase(sendNote);
    }

    @Override
    public String getId() {
        return "reset-credential-email-with-phone";
    }

    @Override
    public String getDisplayType() {
        return "Send Reset Email If Not Phone";
    }

    @Override
    public String getHelpText() {
        return "Send email to user if not phone provided.";
    }

    @Override
    public Requirement[] getRequirementChoices() {
        return REQUIREMENT_CHOICES;
    }

}
