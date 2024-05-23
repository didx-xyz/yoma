<#--
  Login template
  This file is used to render the login page.
-->
<#import "template.ftl" as layout>

<@layout.registrationLayout displayInfo=(realm.password && realm.registrationAllowed && !registrationDisabled??); section>
  <#if section == "header">
   <h1 id="kc-page-title">${msg("loginAccountTitle")}</h1>
  <#elseif section == "form">
    <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
      <#if !usernameHidden??>
        <div class="${properties.kcFormGroupClass!}">
          <label for="username" class="${properties.kcLabelClass!}">
            <#if !realm.loginWithEmailAllowed>
              ${msg("username")}
            <#elseif !realm.registrationEmailAsUsername>
              ${msg("usernameOrEmail")}
            <#else>
              ${msg("email")}
            </#if>
          </label>
          <input tabindex="1" id="username" aria-invalid="<#if messagesPerField.existsError('username')>true</#if>"
                 class="${properties.kcInputClass!}" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="off"
                 placeholder="${msg(properties.kcInputPlaceholder!'Your email address')}" />
          <#if messagesPerField.existsError('username')>
            <span id="input-error-username" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
              ${kcSanitize(messagesPerField.get('username'))?no_esc}
            </span>
          </#if>
        </div>
      </#if>
      <div class="${properties.kcFormGroupClass!}">
        <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>
        <div class="password-container">
            <i class="fa fa-eye-slash" id="toggle-password" onclick="togglePassword('#register-password', '#toggle-password')"></i>
            <input tabindex="2" type="password" id="register-password" class="${properties.kcInputClass!}" name="password"
            autocomplete="new-password"
            aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>" />
        </div>
        <#if messagesPerField.existsError('password')>
          <span id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
            ${kcSanitize(messagesPerField.get('password'))?no_esc}
          </span>
        </#if>
      </div>
      <div class="${properties.kcFormGroupClass!} ${properties.kcFormSettingClass!}">
      <div class="${properties.kcFormOptionsWrapperClass!}">
        <#if realm.resetPasswordAllowed>
          <span><a tabindex="3" href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a></span>
        </#if>
      </div>
        <div id="kc-form-options">
          <#if realm.rememberMe && !usernameHidden??>
            <div class="checkbox">
              <label>
                <#if login.rememberMe??>
                  <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" checked>
                  ${msg("rememberMe")}
                <#else>
                  <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox">
                  ${msg("rememberMe")}
                </#if>
              </label>
            </div>
          </#if>
        </div>
      </div>
      <div id="kc-form-buttons" class="${properties.kcFormGroupClass!}">
        <input tabindex="4" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!}" name="login" id="login" type="submit" value="${msg("doLogIn")}" />
      </div>
    </form>
  <#elseif section == "info">
    <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
        <button tabindex="5" id="kc-registration" onclick="window.location='${url.registrationUrl}'">
          ${msg("doRegister")}
        </button>
    </#if>
  <#elseif section == "socialProviders">
    <#if realm.password && social.providers??>
      <div id="kc-social-providers" class="${properties.kcFormSocialAccountSectionClass!}">
        <h4>${msg("identity-provider-login-label")}</h4>
        <ul class="${properties.kcFormSocialAccountListClass!} <#if social.providers?size gt 3>${properties.kcFormSocialAccountListGridClass!}</#if>">
          <#list social.providers as p>
            <a id="social-${p.alias}" class="${properties.kcFormSocialAccountListButtonClass!} <#if social.providers?size gt 3>${properties.kcFormSocialAccountGridItem!}</#if>" type="button" href="${p.loginUrl}">
              <#if p.iconClasses?has_content>
                <i class="${properties.kcCommonLogoIdP!} ${p.iconClasses!}" aria-hidden="true"></i>
                <span class="${properties.kcFormSocialAccountNameClass!} kc-social-icon-text">
                  <#-- ${p.displayName!} -->
                </span>
              <#else>
                <span class="${properties.kcFormSocialAccountNameClass!}">
                  <#-- ${p.displayName!} -->
                </span>
              </#if>
            </a>
          </#list>
        </ul>
      </div>
    </#if>
  </#if>
</@layout.registrationLayout>
<script src="${url.resourcesPath}/js/passwordIndicator.js"></script>
