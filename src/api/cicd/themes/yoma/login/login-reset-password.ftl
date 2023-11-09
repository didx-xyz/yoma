<#import "template.ftl" as layout>
    <@layout.registrationLayout displayInfo=false displayMessage=!messagesPerField.existsError('username'); section>
        <#if section="header">
            ${msg("emailForgotTitle")}
            <#elseif section="form">
                <label id="kc-register-form" for="username" class="centered-label">
                    ${msg("noWorries")}
                </label>
                <form id="kc-reset-password-form" class="${properties.kcFormClass!}" action="${url.loginAction}" method="post">
                    <div class="${properties.kcFormGroupClass!}">
                        <div class="${properties.kcLabelWrapperClass!}">
                            <label for="username" class="${properties.kcLabelClass!}">
                                <#if !realm.loginWithEmailAllowed>
                                    ${msg("username")}
                                    <#elseif !realm.registrationEmailAsUsername>
                                        ${msg("usernameOrEmail")}
                                </#if>
                            </label>
                        </div>
                        <div class="text-left">
                            <label for="username"
                                class="${properties.kcLabelClass!}">
                                <#if !realm.loginWithEmailAllowed>
                                    ${msg("username")}
                                    <#elseif !realm.registrationEmailAsUsername>
                                        ${msg("usernameOrEmail")}
                                        <#else>
                                            ${msg("email")}
                                </#if>
                            </label>
                        </div>
                        <div class="${properties.kcInputWrapperClass!}">
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
                            <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("emailSendPassword")}" />
                        </div>
                        <div id="kc-form-options" class="${properties.kcFormOptionsClass!}">
                            <br>
                            <hr class="grey-hr">
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
