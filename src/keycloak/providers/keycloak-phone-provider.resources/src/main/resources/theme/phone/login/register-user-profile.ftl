<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm','phoneNumber','code'); section>
  <#if section="header">
    ${msg("registerTitle")}
  <#elseif section="form">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/css/intlTelInput.css">
    <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="${url.resourcesPath}/js/passwordEnhancementsDirective.js"></script>
    <script src="${url.resourcesPath}/js/otp-input.directive.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/intlTelInput.min.js"></script>
    <script src="${url.resourcesPath}/js/intlTelInputDirective.js"></script>

    <div id="vue-app">
      <form ref="form" @submit.prevent="[onConfirmCode, onSubmit]" id="kc-register-form" class="${properties.kcFormClass!}" action="${url.registrationAction}" method="post" @submit="onSubmit">

        <input type="hidden" id="phoneNumberAsUsername" name="phoneNumberAsUsername" v-model="phoneNumberAsUsername">
        <input type="hidden" id="codeSendStatus" name="codeSendStatus" v-model="codeSendStatus">
        <input type="hidden" id="codeExpiresIn" name="codeExpiresIn" v-model="codeExpiresIn">

        <!-- Email Input -->
        <div class="${properties.kcFormGroupClass!}" v-bind:style="{ display: phoneNumberAsUsername ? 'none' : 'block' }">
          <label for="email" class="${properties.kcLabelClass!}">${msg("enterEmail")}</label>

          <input type="text" id="email" class="${properties.kcInputClass!}" name="email" placeholder="example@email.com"
            autocomplete="email" :aria-invalid="!!messageEmailError"
            v-model="email" />

          <#-- LABEL: email error -->
          <div v-if="messageEmailError" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
            {{ messageEmailError }}
          </div>

          <div class="links">
            <#-- BUTTON: use phone -->
            <button type="button" class="link" v-on:click="phoneNumberAsUsername = true" tabindex="0">
              <i aria-hidden="true" class="link-icon fa fa-phone"></i>
              <span class="link-text">${msg("phoneNumberAsUsername")}</span>
            </button>
          </div>
        </div>

        <!-- Phone Number Input -->
        <div class="${properties.kcFormGroupClass!}" v-bind:style="{ display: phoneNumberAsUsername ? 'block' : 'none' }">
          <div v-bind:style="{ display: codeSendStatus === 'NOT_SENT' && !phoneVerified ? 'block' : 'none' }">
            <label for="phoneNumber" class="${properties.kcLabelClass!}">${msg("enterPhoneNumber")}</label>

            <!-- INPUT: phone number -->
            <input id="phoneNumber" class="${properties.kcInputClass!}" name="phoneNumber" type="tel"
              aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" autocomplete="mobile tel"
              v-model="phoneNumber" @input="resetPhoneVerification" v-intl-tel-input />
          </div>

          <#-- LABEL: phone number error -->
          <div v-if="messagePhoneNumberError" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
            {{ messagePhoneNumberError }}
          </div>

          <#-- ALERT: code send status -->
          <div v-if="!phoneVerified && codeSendStatus !== 'NOT_SENT' && !messagePhoneNumberError"
              class="pf-c-alert"
              :class="codeSendStatusAlertConfig.type"
              data-ouia-component-type="PF6/Alert"
              data-ouia-safe="true">
            <div class="pf-c-alert__icon">
              <i :class="['fa', codeSendStatusAlertConfig.icon]" aria-hidden="true"></i>
            </div>
            <h4 class="pf-c-alert__title">
              {{ codeSendStatusAlertConfig.message }}
            </h4>
          </div>

          <#-- ALERT: phone number verified -->
          <div v-if="phoneVerified && !messagePhoneNumberError"
              class="pf-c-alert pf-m-success"
              data-ouia-component-type="PF6/Alert"
              data-ouia-safe="true">
            <div class="pf-c-alert__icon">
              <i class="fa fa-check-circle" aria-hidden="true"></i>
            </div>
            <h4 class="pf-c-alert__title">
             {{ messagePhoneVerified }}
            </h4>
          </div>

          <div class="links">
            <#-- BUTTON: use email -->
            <button type="button" class="link" v-if="codeSendStatus === 'NOT_SENT'" v-on:click="phoneNumberAsUsername = false" tabindex="0">
              <i class="link-icon fa fa-key" aria-hidden="true"></i>
              <span class="link-text">${msg("emailAsUsername")}</span>
            </button>

            <#-- BUTTON: change phone number / send again (start over) -->
            <div v-if="codeSendStatus !== 'NOT_SENT'">
              <button type="button" class="link" v-if="codeSendStatus === 'EXPIRED' && !phoneVerified" v-on:click="clearAndFocusPhoneNumber(false)" tabindex="0">
                <i class="link-icon fa fa-undo" aria-hidden="true"></i>
                <span class="link-text">${msg("codeSendAgain")}</span>
              </button>
              <button type="button" class="link" v-else v-on:click="clearAndFocusPhoneNumber(true)" tabindex="0">
                <i class="link-icon fa fa-undo" aria-hidden="true"></i>
                <span class="link-text">${msg("changePhoneNumber")}</span>
              </button>
            </div>
          </div>
        </div>

        <#if verifyPhone??>
          <div v-bind:style="{ display: phoneNumberAsUsername && !phoneVerified ? 'block' : 'none', marginTop: '2rem' }">
            <#-- BUTTON: send code -->
            <div v-bind:style="{ display: codeSendStatus === 'NOT_SENT' ? 'block' : 'none' }">
              <input tabindex="0" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!}"
                type="button" value="${msg('sendVerificationCode')}" v-on:click="sendVerificationCode()" />
            </div>

            <div class="${properties.kcFormGroupClass!}" v-bind:style="{ display: codeSendStatus !== 'NOT_SENT' ? 'block' : 'none' }">
              <label for="code" class="${properties.kcLabelClass!}">${msg("enterCode")}</label>

              <!-- INPUT: verification code -->
              <input
                type="text"
                id="code"
                name="code"
                v-otp-input="{ onSubmit: onConfirmCode }"
                autocomplete="one-time-code" autofocus
                inputmode="numeric"
                maxlength="6"
                class="${properties.kcInputClass!}"
              />

              <#if messagesPerField.existsError('code')>
                <div id="input-error-code" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                  ${kcSanitize(messagesPerField.getFirstError('code'))?no_esc}
                </div>
              </#if>

              <!-- BUTTON: confirm code (submit) -->
              <div style="margin-top: 30px;">
                <div id="kc-form-buttons">
                  <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                    type="button" v-model="confirmCodeButtonText" v-bind:disabled="confirmCodeButtonText != confirmCodeButtonDefaultText" v-on:click="onConfirmCode" />
                </div>
              </div>
            </div>
          </div>
        </#if>

        <div v-bind:style="{ display: !phoneNumberAsUsername || (phoneNumberAsUsername && phoneVerified) ? 'block' : 'none'}">

          <#if passwordRequired??>
            <#--  Generate password -->
            <div class="${properties.kcFormGroupClass!}">
              <label class="${properties.kcLabelClass!}" for="create-password-checkbox">${msg("createPassword")}</label>

              <div class="radio-wrapper">
                <span id="createPasswordHelpText" for="create-password-checkbox" class="pf-c-form__helper-text">${msg("createPasswordHelpText")}</span>
                <input type="checkbox" id="create-password-checkbox" class="checkbox" />
              </div>
            </div>

            <!-- Password -->
            <div class="${properties.kcFormGroupClass!}">
              <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>
              <div class="password-container">
                <!-- INPUT: password -->
                <input
                  type="password"
                  id="register-password"
                  class="${properties.kcInputClass!}"
                  name="password"
                  autocomplete="new-password"
                  placeholder="${msg('enterPassword')}"
                  aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>"
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
                    passwordServerErrorLabelSelector: '#input-error-password',
                    confirmPasswordServerErrorLabelSelector: '#input-error-password-confirm',
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
                  name="password-confirm" autocomplete="new-password" placeholder="${msg('confirmPassword')}" aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>"
                  v-password-enhancements="{ allowToggle: true, allowCopy: false, allowPasswordIndicator: false }"
                />
              </div>

              <#if messagesPerField.existsError('password-confirm')>
                <div id="input-error-password-confirm" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                  ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                </div>
              </#if>
            </div>
          </#if>

          <!-- Terms and Conditions -->
          <div class="centered-div">
            <div class="centered-checkbox">
              <label for="terms_and_conditions" id="terms-label">
			  	<span id="terms-prefix">${msg("termsText1")}</span>
                <a href="https://yoma.world/terms" target="_blank" id="terms-text">${msg("termsText2")}</a>
              </label>
            </div>
          </div>

          <!-- Recaptcha -->
          <#if recaptchaRequired??>
            <div class="${properties.kcFormGroupClass!}">
              <div class="${properties.kcInputWrapperClass!}">
                <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
              </div>
            </div>
          </#if>

           <!-- Submit Button -->
          <div id="kc-form-buttons">
            <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
              type="submit" v-model="submitButtonText" v-bind:disabled="submitButtonText != submitButtonDefaultText" />
          </div>
        </div>

        <div id="kc-form-options">
          <span><a href="${url.loginUrl}">${kcSanitize(msg("backToLoginBtn"))?no_esc}</a></span>
        </div>
      </form>
    </div>

    <script type="text/javascript">
      const CODE_SEND_STATUS = {
        NOT_SENT: 'NOT_SENT',
        SENT: 'SENT',
        ALREADY_SENT: 'ALREADY_SENT',
        ERROR: 'ERROR',
        EXPIRED: 'EXPIRED'
      };

      new Vue({
        el: '#vue-app',
        data: {
          email: '${register.formData.email!}',
          phoneNumber: '${register.formData.phoneNumber!}',
          phoneNumberAsUsername: ${(register.formData.phoneNumberAsUsername!false)?string},
          phoneVerified: <#if phoneVerified?? && phoneVerified>true<#else>false</#if>,
          messagePhoneNumberError: <#if messagesPerField.existsError('phoneNumber')>'${kcSanitize(messagesPerField.getFirstError('phoneNumber'))?no_esc}'<#else>''</#if>,
          messageEmailError: <#if messagesPerField.existsError('email')>'${kcSanitize(messagesPerField.getFirstError('email'))?no_esc}'<#else>''</#if>,
          confirmCodeButtonText: "${msg('confirmCode')}",
          confirmCodeButtonDefaultText: "${msg('confirmCode')}",
          submitButtonText: "${msg('doRegisterBtn')}",
          submitButtonDefaultText: "${msg('doRegisterBtn')}",
          resetSendCodeButton: false,
          KC_HTTP_RELATIVE_PATH: <#if KC_HTTP_RELATIVE_PATH?has_content>'${KC_HTTP_RELATIVE_PATH}'<#else>''</#if>,
          codeSendStatus: <#if codeSendStatus??>'${codeSendStatus}'<#else>'NOT_SENT'</#if>,
          codeExpiresIn: <#if codeExpiresIn??>${codeExpiresIn}<#else>0</#if>,
          isPasswordValid: false,
          isPasswordConfirmValid: false,
          isFormValid: false,
        },
        mounted() {
            if (this.codeExpiresIn > 0) {
                this.countDownExpiresIn(this.codeExpiresIn);
            }
        },
        computed: {
          maskedPhoneNumber() {
            if (!this.phoneNumber) return '';
            return this.phoneNumber;
          },
          formattedCountdown() {
            const minutes = Math.floor(this.codeExpiresIn / 60);
            const seconds = this.codeExpiresIn % 60;
            return minutes + ':' + seconds.toString().padStart(2, '0');
          },
          codeSendStatusAlertConfig() {
              const configs = {
                'SENT': {
                  message: "${msg('codeSent')?no_esc}",
                  icon: 'fa-check-circle',
                  type: 'pf-m-success'
                },
                'ALREADY_SENT': {
                  message: "${msg('codeSentAlready')?no_esc}",
                  icon: 'fa-exclamation-triangle',
                  type: 'pf-m-warning'
                },
                'ERROR': {
                  message: "${msg('codeSendError')?no_esc}",
                  icon: 'fa-exclamation-circle',
                  type: 'pf-m-danger'
                },
                'EXPIRED': {
                  message: "${msg('codeExpired')?no_esc}",
                  icon: 'fa-clock',
                  type: 'pf-m-danger'
                }
              };

              const config = configs[this.codeSendStatus] || {};
              if (config.message) {
                config.message = config.message
                  .replace('{0}', this.maskedPhoneNumber)
                  .replace('{1}', this.formattedCountdown);
              }
              return config;
          },
          messagePhoneVerified() {
            const format = '${msg("phoneNumberVerified")}'; // 'A code has been sent to {0}.'
            return format.replace('{0}', this.maskedPhoneNumber);
          },
        },
        watch: {
          email(newValue) {
            this.validateEmail(newValue);
          },
        },
        methods: {
          validateEmail(email) {
            let isEmailValid = false;

            if (email !== undefined) {
              const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              isEmailValid = emailPattern.test(email);
              this.messageEmailError = isEmailValid ? '' : '${msg("invalidEmailMessage")}';
            }

            return isEmailValid;
          },
          onValidityChange(passwordValid, confirmPasswordValid) {
            this.isPasswordValid = passwordValid;
            this.isPasswordConfirmValid = confirmPasswordValid;
          },
          req(phoneNumber) {
            const params = { params: { phoneNumber } };
            axios.get(window.location.origin + this.KC_HTTP_RELATIVE_PATH + '/realms/${realm.name}/sms/registration-code', params)
              .then(res =>
                {
                  // set code send status to SENT
                  this.codeSendStatus = CODE_SEND_STATUS.SENT;

                  this.countDownExpiresIn(res.data.expires_in);
                  this.clearMessages();
                })
                .catch(e => {
                  if (e?.response?.status === 400) {
                      const errorMessage = e.response.data.error;
                      if (errorMessage.startsWith("ALREADY_SENT")) {
                          const expiryMatch = errorMessage.match(/Expiry: (\d+)/);
                          const expiryTime = expiryMatch ? parseInt(expiryMatch[1], 10) : 300; // Default to 300 seconds if not found

                          // set code send status to ALREADY_SENT
                          this.codeSendStatus = CODE_SEND_STATUS.ALREADY_SENT;

                          this.countDownExpiresIn(expiryTime);
                          return;
                      }
                  }

                  // show server error
                  this.messagePhoneNumberError = e.response.data.error;
                });
          },
          countDownExpiresIn(seconds) {
            clearTimeout(this.countdownTimer);

            this.codeExpiresIn = Math.max(0, seconds);

            if (seconds > 0) {
              this.countdownTimer = setTimeout(() => {
                this.countDownExpiresIn(seconds - 1);
              }, 1000);
            } else {
              // set code send status to EXPIRED
              this.codeSendStatus = CODE_SEND_STATUS.EXPIRED;
            }
          },
          sendVerificationCode() {
            this.messagePhoneNumberError = '';
            const input = document.querySelector('#phoneNumber');
            const iti = intlTelInput.getInstance(input);
            const fullPhoneNumber = iti.getNumber();

            // Validate phone number
            if (!iti.isValidNumber()) {
              this.messagePhoneNumberError = '${msg("invalidPhoneNumber")}';
              return;
            }

            this.req(fullPhoneNumber);
          },
          onConfirmCode(event){
            // set essential form fields
            this.setFormFields();

            // submit the form
            this.$refs.form.submit(event);

            // show button loading state
            this.confirmCodeButtonText = "${msg('loading')}";
          },
          onSubmit(event) {
            event.preventDefault(); // Prevent the default form submission

            // validate form fields
            if (!this.validateForm()) return false;

            // set essential form fields
            this.setFormFields();

            // submit the form
            this.$refs.form.submit();

            // show button loading state
            this.submitButtonText = "${msg('loading')}";
          },
          validateForm() {
            let validatePassword = false;

            // Validate the email for non-phone submissions
            if (!this.phoneNumberAsUsername) {
              if (!this.validateEmail(this.email)) {
                this.isFormValid = false;

                return false;
              }
              validatePassword = true;
            }
            else if (this.phoneVerified) {
              validatePassword = true;
            }

            if (validatePassword) {
              // Validate the password
              const isValid = this.isPasswordValid && this.isPasswordConfirmValid;
              this.isFormValid = isValid;
              if (!isValid) return false;
            }

            return true;
          },
          setFormFields(){
            // Additional processing
            const inputPhone = document.querySelector('#phoneNumber');
            const inputEmail = document.querySelector('#email');
            if (this.phoneNumberAsUsername) {
              const iti = intlTelInput.getInstance(inputPhone);
              const fullPhoneNumber = iti.getNumber();

              inputPhone.value = fullPhoneNumber;
              inputPhone.disabled = false;

              inputEmail.value = '';
            } else {
              inputPhone.value = '';
            }

            // Ensure password inputs are of type "password"
            const password = document.querySelector('#register-password');
            if (password.type === "text") {
              password.type = "password";
            }
            const passwordConfirm = document.querySelector('#password-confirm');
            if (passwordConfirm.type === "text") {
              passwordConfirm.type = "password";
            }

            // set the codeExpiresIn hidden input to the current expiration time
            document.querySelector('#codeExpiresIn').value = this.codeExpiresIn;
          },
          resetPhoneVerification() {
            this.phoneVerified = false;
            this.codeSendStatus = CODE_SEND_STATUS.NOT_SENT;
            this.resetSendCodeButton = true;
            this.clearMessages();
          },
          clearAndFocusPhoneNumber(clearPhoneNumber) {
            if (clearPhoneNumber) this.phoneNumber = '';

            const phoneNumber = document.querySelector('#phoneNumber');
            if (phoneNumber) {
              phoneNumber.focus();
            }

            this.resetPhoneVerification();
          },
          clearMessages() {
            this.messagePhoneNumberError = '';

            // clear server error messages
            const inputErrorPhone = document.querySelector('#input-error-phone');
            const inputErrorCode = document.querySelector('#input-error-code');

            if (inputErrorPhone) inputErrorPhone.style.display = 'none';
            if (inputErrorCode) inputErrorCode.style.display = 'none';
          },
        }
      });
    </script>
  <#elseif section = "info" >
    <#if realm.password && !registrationDisabled??>
      <div id="kc-login-container" style="margin-top: 20px;">
        <a id="kc-login" href="${url.loginUrl}">
          ${msg("alreadyHaveAccount")} ${msg("doLogin")}
        </a>
      </div>
    </#if>
  <#elseif section = "socialProviders" >
    <#if realm.password && social.providers??>
      <div id="kc-social-providers" class="${properties.kcFormSocialAccountSectionClass!}">
          <hr/>
          <h4>${msg("identity-provider-register-label")}</h4>
          <ul class="${properties.kcFormSocialAccountListClass!} <#if social.providers?size gt 3>${properties.kcFormSocialAccountListGridClass!}</#if>">
              <#list social.providers as p>
                  <a id="social-${p.alias}" class="social-provider-btn ${properties.kcFormSocialAccountListButtonClass!} <#if social.providers?size gt 3>${properties.kcFormSocialAccountGridItem!}</#if>"
                     type="button" href="${p.loginUrl}">
                      <#if p.alias == "google">
                          <img class="${properties.kcCommonLogoIdP!} ${p.iconClasses!}" src="${url.resourcesPath}/img/google-logo.svg" alt="Google" />
                          <span class="${properties.kcFormSocialAccountNameClass!} kc-social-icon-text">${p.displayName!}</span>
                      <#elseif p.alias == "facebook">
                          <img class="${properties.kcCommonLogoIdP!} ${p.iconClasses!}" src="${url.resourcesPath}/img/facebook-logo.svg" alt="Facebook" />
                          <span class="${properties.kcFormSocialAccountNameClass!} kc-social-icon-text">${p.displayName!}</span>
                      <#elseif p.iconClasses?has_content>
                          <i class="${properties.kcCommonLogoIdP!} ${p.iconClasses!}" aria-hidden="true"></i>
                          <span class="${properties.kcFormSocialAccountNameClass!} kc-social-icon-text">${p.displayName!}</span>
                      <#else>
                          <span class="${properties.kcFormSocialAccountNameClass!}">${p.displayName!}</span>
                      </#if>
                  </a>
              </#list>
          </ul>
      </div>
    </#if>
  </#if>
</@layout.registrationLayout>
