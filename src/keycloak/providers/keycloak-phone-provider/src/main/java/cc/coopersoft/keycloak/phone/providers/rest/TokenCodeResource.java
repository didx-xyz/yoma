package cc.coopersoft.keycloak.phone.providers.rest;

import org.jboss.logging.Logger;
import org.jboss.resteasy.annotations.cache.NoCache;
import org.keycloak.models.KeycloakSession;
import org.keycloak.services.validation.Validation;

import cc.coopersoft.keycloak.phone.Utils;
import cc.coopersoft.keycloak.phone.providers.constants.TokenCodeType;
import cc.coopersoft.keycloak.phone.providers.exception.PhoneNumberInvalidException;
import cc.coopersoft.keycloak.phone.providers.spi.PhoneProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import static jakarta.ws.rs.core.MediaType.APPLICATION_JSON;
import static jakarta.ws.rs.core.MediaType.APPLICATION_JSON_TYPE;
import jakarta.ws.rs.core.Response;

public class TokenCodeResource {

    private static final Logger logger = Logger.getLogger(TokenCodeResource.class);
    protected final KeycloakSession session;
    protected final TokenCodeType tokenCodeType;

    TokenCodeResource(KeycloakSession session, TokenCodeType tokenCodeType) {
        this.session = session;
        this.tokenCodeType = tokenCodeType;
    }

    @GET
    @NoCache
    @Path("")
    @Produces(APPLICATION_JSON)
    public Response getTokenCode(@NotBlank @QueryParam("phoneNumber") String phoneNumber,
            @QueryParam("kind") String kind) {

        if (Validation.isBlank(phoneNumber)) {
            throw new BadRequestException("Must supply a phone number");
        }

        // ensure phone number starts with +
        if (!phoneNumber.startsWith("+")) {
            phoneNumber = "+" + phoneNumber;
        }

        var phoneProvider = session.getProvider(PhoneProvider.class);

        try {
            phoneNumber = Utils.canonicalizePhoneNumber(session, phoneNumber);
        } catch (PhoneNumberInvalidException e) {
            throw new BadRequestException("Phone number is invalid");
        }

        // check if phone number exists
        boolean phoneNumberExists = !Utils.findUserByPhone(session, session.getContext().getRealm(), phoneNumber).isEmpty();

        // check if the phone number is valid for the requested operation
        if ((TokenCodeType.AUTH.equals(tokenCodeType) || TokenCodeType.RESET.equals(tokenCodeType)) && !phoneNumberExists) {
            throw new ForbiddenException("We can't find your number, sign up first if you haven't.");
        } else if (TokenCodeType.REGISTRATION.equals(tokenCodeType) && phoneNumberExists) {
            throw new ForbiddenException("This phone number is already registered. Sign in or use a different number.");
        }

        logger.info(String.format("Requested %s code to %s", tokenCodeType.label, phoneNumber));
        int tokenExpiresIn = phoneProvider.sendTokenCode(phoneNumber,
                session.getContext().getConnection().getRemoteAddr(), tokenCodeType, kind);

        String response = String.format("{\"expires_in\":%s}", tokenExpiresIn);

        return Response.ok(response, APPLICATION_JSON_TYPE).build();
    }
}
