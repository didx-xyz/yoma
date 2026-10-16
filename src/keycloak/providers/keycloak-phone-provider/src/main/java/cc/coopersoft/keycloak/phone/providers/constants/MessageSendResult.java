package cc.coopersoft.keycloak.phone.providers.constants;

/**
 * Outcome of a message send that did not fail.
 */
public enum MessageSendResult {

    /** Delivered, or handed to a channel that gives no delivery receipt (SMS). */
    SENT,

    /** Accepted by the channel, but delivery was not confirmed before we stopped waiting. */
    DELIVERY_UNCONFIRMED
}
