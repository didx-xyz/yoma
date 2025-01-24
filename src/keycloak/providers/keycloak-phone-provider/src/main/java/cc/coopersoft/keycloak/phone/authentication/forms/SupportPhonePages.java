package cc.coopersoft.keycloak.phone.authentication.forms;

public class SupportPhonePages {

    public enum Errors {
        MISSING("requiredPhoneNumber"),
        USER_NOT_FOUND("phoneUserNotFound"),
        NUMBER_INVALID("invalidPhoneNumber"),
        NO_PROCESS("noOngoingVerificationProcess"),
        EXISTS("phoneNumberExists"),
        ABUSED("abusedMessageService"),
        NOT_MATCH("phoneTokenCodeDoesNotMatch"),
        FAIL("sendVerificationCodeFail");

        private final String errorMessage;

        public String message() {
            return errorMessage;
        }

        Errors(String message) {
            this.errorMessage = message;
        }
    }

    public static final String ATTRIBUTE_SUPPORT_PHONE = "supportPhone";

    public static final String FIELD_PHONE_NUMBER = "phoneNumber";

    public static final String FIELD_VERIFICATION_CODE = "code";

    public static final String FIELD_PATH_PHONE_ACTIVATED = "phoneActivated";

    public static final String FIELD_PHONE_NUMBER_CODE_SENT = "isCodeSent";

    public static final String FIELD_SMS_CODE_SEND_STATUS = "codeSendStatus";

    public static final String FIELD_CANCEL = "cancel";

    public static final String ATTEMPTED_PHONE_NUMBER = "attemptedPhoneNumber";

    public static final String ATTEMPTED_PHONE_ACTIVATED = "attemptedPhoneActivated";
}
