package cc.coopersoft.keycloak.phone.providers.representations;

import java.security.SecureRandom;
import java.util.Date;

import org.keycloak.models.utils.KeycloakModelUtils;

public class TokenCodeRepresentation {

    private String id;
    private String phoneNumber;
    private String code;
    private String type;
    private Date createdAt;
    private Date expiresAt;
    private Boolean confirmed;

    // Default constructor
    public TokenCodeRepresentation() {
    }

    // All-args constructor
    public TokenCodeRepresentation(String id, String phoneNumber, String code, String type, Date createdAt, Date expiresAt, Boolean confirmed) {
        this.id = id;
        this.phoneNumber = phoneNumber;
        this.code = code;
        this.type = type;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.confirmed = confirmed;
    }

    // Getters and Setters for all fields
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Date getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Date expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Boolean getConfirmed() {
        return confirmed;
    }

    public void setConfirmed(Boolean confirmed) {
        this.confirmed = confirmed;
    }

    // Static method to generate TokenCodeRepresentation for phone number
    public static TokenCodeRepresentation forPhoneNumber(String phoneNumber) {
        TokenCodeRepresentation tokenCode = new TokenCodeRepresentation();
        tokenCode.id = KeycloakModelUtils.generateId();
        tokenCode.phoneNumber = phoneNumber;
        tokenCode.code = generateTokenCode();
        tokenCode.confirmed = false;
        return tokenCode;
    }

    // Static method to generate TokenCodeRepresentation for test phone number with hardcoded code
    public static TokenCodeRepresentation forTestPhoneNumber(String phoneNumber) {
        TokenCodeRepresentation tokenCode = new TokenCodeRepresentation();
        tokenCode.id = KeycloakModelUtils.generateId();
        tokenCode.phoneNumber = phoneNumber;
        tokenCode.code = "1234"; // Hardcoded test code
        tokenCode.confirmed = false;
        return tokenCode;
    }

    // Method to generate token code
    private static String generateTokenCode() {
        SecureRandom secureRandom = new SecureRandom();
        Integer code = secureRandom.nextInt(999_999);
        return String.format("%06d", code);
    }
}
