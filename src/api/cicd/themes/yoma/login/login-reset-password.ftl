<#import "template.ftl" as layout>
    <@layout.registrationLayout displayInfo=false displayMessage=!messagesPerField.existsError('username'); section>
        <#if section="header">
            ${msg("emailForgotTitle")}
            <#elseif section="form">
                <p id="forget-password-text">
                    ${msg("noWorries")}
                </p>
                <form id="kc-reset-password-form" class="${properties.kcFormClass!}" action="${url.loginAction}" method="post">
                    <div class="${properties.kcFormGroupClass!}">
                        <div class="${properties.kcInputWrapperClass!}">
                          <label for="username"
                                class="${properties.kcLabelClass!}" id="forgot-password-email-label">
                                <#if !realm.loginWithEmailAllowed>
                                    ${msg("username")}
                                    <#elseif !realm.registrationEmailAsUsername>
                                        ${msg("usernameOrEmail")}
                                        <#else>
                                      ${msg("email")}
                                </#if>
                            </label>
                            <input type="text" id="username" name="username" class="${properties.kcInputClass!}" autofocus value="${(auth.attemptedUsername!'')}" aria-invalid="<#if messagesPerField.existsError('username')>true</#if>" />
                            <#if messagesPerField.existsError('username')>
                                <span id="input-error-username" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('username'))?no_esc}
                                </span>
                            </#if>
                        </div>
                    </div>
                    <div class="${properties.kcFormGroupClass!} ${properties.kcFormSettingClass!}">
                        <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                            <input id="reset-password-btn" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("emailSendPassword")}" />
                        </div>
                        <div id="kc-form-options" class="${properties.kcFormOptionsClass!}">
                            <br>
                            <div class="${properties.kcFormOptionsWrapperClass!}">
                                <span>
                                    <a href="${url.loginUrl}">
                                        ${msg("goBack")}
                                        ${kcSanitize(msg("doLogIn"))?no_esc}
                                    </a></span>
                            </div>
                        </div>
                    </div>
                </form>
        </#if>
    </@layout.registrationLayout>
