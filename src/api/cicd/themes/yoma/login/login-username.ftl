<#import "template.ftl" as layout>
  <@layout.registrationLayout displayMessage=!messagesPerField.existsError('username') displayInfo=(realm.password && realm.registrationAllowed && !registrationDisabled??); section>
    <#if section="header">
      ${msg("loginAccountTitle")}
      <label id="kc-register-form" for="username" class="centered-label">
        ${msg("loginSubTitle")}
      </label>
      <#elseif section="form">
        <div id="kc-form">
          <div id="kc-form-wrapper">
            <#if realm.password>
              <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}"
                method="post">
                <#if !usernameHidden??>
                  <div class="${properties.kcFormGroupClass!}">
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
                    <input tabindex="1" id="username"
                      aria-invalid="<#if messagesPerField.existsError('username')>true</#if>"
                      class="${properties.kcInputClass!}" name="username"
                      value="${(login.username!'')}"
                      type="text" autofocus autocomplete="off" />
                    <#if messagesPerField.existsError('username')>
                      <span id="input-error-username" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                        ${kcSanitize(messagesPerField.get('username'))?no_esc}
                      </span>
                    </#if>
                  </div>
                </#if>
                <div class="${properties.kcFormGroupClass!} ${properties.kcFormSettingClass!}">
                  <div id="kc-form-options">
                    <#if realm.rememberMe && !usernameHidden??>
                      <div class="checkbox">
                        <label>
                          <#if login.rememberMe??>
                            <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox"
                              checked>
                            ${msg("rememberMe")}
                            <#else>
                              <input tabindex="3" id="rememberMe" name="rememberMe"
                                type="checkbox">
                              ${msg("rememberMe")}
                          </#if>
                        </label>
                      </div>
                    </#if>
                  </div>
                </div>
                <div id="kc-form-buttons" class="${properties.kcFormGroupClass!}">
                </div>
                <hr class="grey-hr">
              </form>
            </#if>
          </div>
        </div>
        <#elseif section="info">
          <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div id="kc-registration">
              <span tabindex="6" onclick="window.location='${url.registrationUrl}'" class="white-link">
                <!-- ${msg("doRegister")} -->
              </span>
            </div>
          </#if>
          <#elseif section="socialProviders">
            <#if realm.password && social.providers??>
              <div id="kc-social-providers" class="${properties.kcFormSocialAccountSectionClass!}">
                <hr />
                <h4>
                  ${msg("identity-provider-login-label")}
                </h4>
                <ul class="${properties.kcFormSocialAccountListClass!}
<#if social.providers?size gt 3>
${properties.kcFormSocialAccountListGridClass!}
</#if>">
                  <#list social.providers as p>
                    <a id="social-${p.alias}" class="${properties.kcFormSocialAccountListButtonClass!}
<#if social.providers?size gt 3>
${properties.kcFormSocialAccountGridItem!}
</#if>"
                      type="button" href="${p.loginUrl}">
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
