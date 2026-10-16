package cc.coopersoft.keycloak.phone.providers.exception;

/**
 * The message cannot reach this recipient, for example the number is not on
 * WhatsApp and SMS is not supported for its country. Retrying will not help,
 * so it is reported to the client as a bad request rather than an outage.
 */
public class MessageRecipientException extends MessageSendException {

    public MessageRecipientException(String message, Throwable cause) {
        super(message, cause);
    }
}
