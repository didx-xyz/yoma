package cc.coopersoft.keycloak.phone.providers.representations;

/**
 * Result of sending a token code.
 *
 * @param expiresIn         seconds until the code expires
 * @param deliveryConfirmed false when the message was accepted but delivery was not confirmed
 */
public record TokenCodeSendResult(int expiresIn, boolean deliveryConfirmed) {
}
