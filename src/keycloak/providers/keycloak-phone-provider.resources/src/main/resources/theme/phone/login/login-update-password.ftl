<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('password','password-confirm'); section>
    <#if section = "header">
      <h1>${msg("updatePasswordTitle")}</h1>
    <#elseif section = "form">
      <link rel="stylesheet" type="text/css" href="${url.resourcesPath}/css/passwordIndicator.css">
      <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
      <script src="${url.resourcesPath}/js/passwordEnhancementsDirective.js"></script>

      <div id="vue-app">
        <form id="kc-passwd-update-form" class="${properties.kcFormClass!}" action="${url.loginAction}" method="post" @submit="onSubmit">
          <input type="text" id="username" name="username" value="${username}" autocomplete="username" readonly="readonly" style="display:none;"/>
          <input type="password" id="password" name="password" autocomplete="current-password" style="display:none;"/>

          <#-- Generate password -->
          <div class="${properties.kcFormGroupClass!}">
              <label class="${properties.kcLabelClass!}" for="create-password-checkbox">${msg("createPassword")}</label>

              <div class="radio-wrapper">
                <span id="createPasswordHelpText" for="create-password-checkbox" class="pf-c-form__helper-text">${msg("createPasswordHelpText")}</span>
                <input type="checkbox" id="create-password-checkbox" class="checkbox" />
              </div>
          </div>

          <!-- Password -->
          <div class="${properties.kcFormGroupClass!}">
            <label for="password-new" class="${properties.kcLabelClass!}">${msg("passwordNew")}</label>
            <div class="password-container">
              <!-- INPUT: password -->
              <input
                type="password"
                id="password-new"
                class="${properties.kcInputClass!}"
                name="password-new"
                autocomplete="new-password"
                autofocus="autofocus"
                placeholder="${msg('enterPassword')}"
                aria-invalid="<#if messagesPerField.existsError('password')>true</#if>"
                v-password-enhancements="{
                  allowToggle: true,
                  allowCopy: true,
                  allowPasswordIndicator: true,
                  allowGenerate: true,
                  messages: {
                    passwordInvalidMessage: '${msg('invalidPasswordMessage')?js_string}',
                    passwordMismatchMessage: '${msg('invalidPasswordConfirmMessage')?js_string}',
                    passwordCreated: '${msg('passwordCreated')?js_string}',
                    passwordCopySuccess: '${msg('passwordCopied')?js_string}',
                    passwordCopyFailed: '${msg('passwordCopyFailed')?js_string}',
                    copyButtonText: '${msg('copyPassword')?js_string}',
                    passwordRequirements: {
                      instructions: '${msg('passwordInstructions')?js_string}',
                      length: '${msg('password_requirement_length')?js_string}',
                      lowercase: '${msg('password_requirement_lowercase')?js_string}',
                      uppercase: '${msg('password_requirement_uppercase')?js_string}',
                      number: '${msg('password_requirement_number')?js_string}',
                      email: '${msg('password_requirement_email')?js_string}'
                    }
                  },
                  confirmPasswordInputSelector: '#password-confirm',
                  confirmPasswordContainerSelector: '#passwordConfirmContainer',
                  createPasswordCheckboxSelector: '#create-password-checkbox',
                  errorLabelSelector: '#input-error-password',
                  copyPasswordButtonStyle: 'block',
                  onValidityChange: onValidityChange
                }"
              />

              <#if messagesPerField.existsError('password')>
                <div id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                  ${kcSanitize(messagesPerField.get('password'))?no_esc}
                </div>
              </#if>
            </div>
          </div>

          <!-- Confirm Password -->
          <div id="passwordConfirmContainer" class="${properties.kcFormGroupClass!}">
            <label for="password-confirm" class="${properties.kcLabelClass!}">${msg("passwordConfirm")}</label>

            <div class="password-container">
              <!-- INPUT: confirm password -->
              <input type="password" id="password-confirm" class="${properties.kcInputClass!}"
                name="password-confirm" placeholder="${msg('confirmPassword')}" aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>"
                v-password-enhancements="{ allowToggle: true, allowCopy: false, allowPasswordIndicator: false }"
              />
            </div>

            <#if messagesPerField.existsError('password-confirm')>
              <div id="input-error-password-confirm" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
              </div>
            </#if>
          </div>

          <div class="centered-div">
            <div class="centered-checkbox">
              <input type="checkbox" id="logout-sessions" name="logout-sessions" value="on" checked />
              <label for="logout-sessions" id="logout-sessions-label" class="centered-label">
                ${msg("logoutOtherSessions")}
              </label>
            </div>
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

      <script>
        new Vue({
          el: '#vue-app',
          data: {
            isPasswordValid: false,
            isPasswordConfirmValid: false,
            isFormValid: false,
          },
          methods: {
            onValidityChange(passwordValid, confirmPasswordValid) {
              this.isPasswordValid = passwordValid;
              this.isPasswordConfirmValid = confirmPasswordValid;
            },
            onSubmit() {
              event.preventDefault();

              // Validate the passwords
              const isValid = this.isPasswordValid && this.isPasswordConfirmValid;
              this.isFormValid = isValid;
              if (!isValid) return false;

              // ensure password inputs are of type "password" (toggle password)
              const passwordNew = document.querySelector('#password-new');
              if (passwordNew && passwordNew.type === 'text') {
                passwordNew.type = 'password';
              }
              const passwordConfirm = document.querySelector('#password-confirm');
              if (passwordConfirm && passwordConfirm.type === 'text') {
                passwordConfirm.type = 'password';
              }

              event.target.submit();
            },
          },
        });
      </script>
    </#if>
</@layout.registrationLayout>
