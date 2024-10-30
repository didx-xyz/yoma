<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('password','password-confirm'); section>
    <#if section = "header">
      <h1>${msg("updatePasswordTitle")}</h1>
    <#elseif section = "form">
      <div id="vue-app">
        <form id="kc-passwd-update-form" class="${properties.kcFormClass!}" action="${url.loginAction}" method="post">
          <input type="text" id="username" name="username" value="${username}" autocomplete="username" readonly="readonly" style="display:none;"/>
          <input type="password" id="password" name="password" autocomplete="current-password" style="display:none;"/>

          <#--  Generate password  -->
          <div class="${properties.kcFormGroupClass!}">
            <label class="${properties.kcLabelClass!}">${msg("createPassword")}</label>

            <div class="radio-wrapper">
              <span for="create-password-radio" class="pf-c-form__helper-text">${msg("createPasswordHelpText")}</span>
              <input type="checkbox" id="create-password-checkbox" class="checkbox" v-password-generator="{ passwordSelector: '#password-new', confirmPasswordSelector: '#password-confirm' }">
            </div>
          </div>

          <div class="${properties.kcFormGroupClass!}">
            <label for="password-new" class="${properties.kcLabelClass!}">${msg("passwordNew")}</label>

            <div class="password-container">
              <i class="fa fa-eye-slash" id="toggle-password" v-toggle-password="{ passwordSelector: '#password-new' }" tabindex="0"></i>
              <input type="password" id="password-new" name="password-new" class="${properties.kcInputClass!}"
                  autofocus autocomplete="new-password"
                  aria-invalid="<#if messagesPerField.existsError('password','password-new')>true</#if>"
              />
            </div>

            <#if messagesPerField.existsError('password')>
                <span id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                    ${kcSanitize(messagesPerField.get('password'))?no_esc}
                </span>
            </#if>

            <div class="password-requirements" v-password-indicator="{
              resourcesPath: '${url.resourcesPath}',
              passwordSelector: '#password-new',
              labels: {
                length: '${msg('password_requirement_length')}',
                lowercase: '${msg('password_requirement_lowercase')}',
                uppercase: '${msg('password_requirement_uppercase')}',
                number: '${msg('password_requirement_number')}',
                email: '${msg('password_requirement_email')}'
              }
            }"></div>
          </div>

          <div class="${properties.kcFormGroupClass!}">
            <label for="password-confirm" class="${properties.kcLabelClass!}">${msg("passwordConfirm")}</label>

            <div class="password-container">
              <i class="fa fa-eye-slash" id="toggle-password" v-toggle-password="{ passwordSelector: '#password-confirm' }" tabindex="0"></i>
              <input type="password" id="password-confirm" name="password-confirm" class="${properties.kcInputClass!}" autocomplete="new-password"
                aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>"
            />

            <#if messagesPerField.existsError('password-confirm')>
                <span id="input-error-password-confirm" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                  ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                </span>
            </#if>
            </div>
          </div>

          <div class="checkbox-update-password-container">
            <label class="checkbox-update-password-label"><input type="checkbox" id="logout-sessions" name="logout-sessions" value="on" checked> ${msg("logoutOtherSessions")}</label>
          </div>

          <div id="kc-form-buttons">
              <#if isAppInitiatedAction??>
                  <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("doSubmit")}" />
                  <button class="${properties.kcButtonClass!} ${properties.kcButtonDefaultClass!} ${properties.kcButtonLargeClass!}" type="submit" name="cancel-aia" value="true" />${msg("doCancel")}</button>
              <#else>
                  <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("doSubmit")}" />
              </#if>
          </div>
        </form>
      </div>

      <link rel="stylesheet" type="text/css" href="${url.resourcesPath}/css/passwordIndicator.css">
      <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
      <script src="${url.resourcesPath}/js/passwordIndicatorDirective.js"></script>
      <script src="${url.resourcesPath}/js/togglePasswordDirective.js"></script>
      <script src="${url.resourcesPath}/js/passwordGeneratorDirective.js"></script>

      <script>
        new Vue({
          el: '#vue-app'
        });
      </script>
    </#if>
</@layout.registrationLayout>
