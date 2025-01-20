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
      <form ref="form" @submit.prevent="confirmCode" id="kc-register-form" class="${properties.kcFormClass!}" action="${url.registrationAction}" method="post" @submit="onSubmit">

        <input type="hidden" id="phoneNumberAsUsername" name="phoneNumberAsUsername" v-model="phoneNumberAsUsername">
        <input type="hidden" id="isCodeSent" name="isCodeSent" v-model="isCodeSent">

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

          <#-- LINK: use phone -->
          <div class="form-link" style="margin-top: 0.8rem" v-on:click="phoneNumberAsUsername = true" tabindex="0">
            <span class="icon">📲</span>
            <span class="text">${msg("phoneNumberAsUsername")}</span>
          </div>
        </div>

        <!-- Phone Number Input -->
        <div class="${properties.kcFormGroupClass!}" v-bind:style="{ display: phoneNumberAsUsername ? 'block' : 'none' }">
          <div v-bind:style="{ display: !isCodeSent && !phoneVerified ? 'block' : 'none' }">
            <label for="phoneNumber" class="${properties.kcLabelClass!}">${msg("enterPhoneNumber")}</label>

            <!-- INPUT: phone number -->
            <input id="phoneNumber" class="${properties.kcInputClass!}" name="phoneNumber" type="tel"
              aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" autocomplete="mobile tel"
              v-model="phoneNumber" @input="resetPhoneVerification" v-intl-tel-input :disabled="phoneVerified" />
          </div>

          <#-- LABEL: phone number error -->
          <div v-if="messagePhoneNumberError" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
            {{ messagePhoneNumberError }}
          </div>

          <#-- LABEL: code send success -->
          <span v-if="isCodeSent && !phoneVerified && !messagePhoneNumberError" aria-live="polite" style="color: green;">
            <span style="margin-right: 5px;">✅</span> {{ messageCodeSent }}
          </span>

          <#-- LABEL: phone number verified -->
          <div v-bind:style="{ display: phoneVerified && !messagePhoneNumberError ? 'block' : 'none' }">
            <span style="color: green;"><span style="margin-right: 5px;">✅</span> {{ messagePhoneVerified }}</span>
          </div>

          <div style="margin-top: 0.8rem">
            <#-- LINK: use email -->
            <div v-if="!isCodeSent" class="form-link" v-on:click="phoneNumberAsUsername = false" tabindex="0">
              <span class="icon">📩</span>
              <span class="text">${msg("emailAsUsername")}</span>
            </div>

            <#-- LINK: change phone number -->
            <div v-if="isCodeSent || phoneVerified" class="form-link" v-on:click="clearAndFocusPhoneNumber" tabindex="0">
              <span class="icon">🔃</span>
              <span class="text">${msg("changePhoneNumber")}</span>
            </div>
          </div>
        </div>

        <#if verifyPhone??>
          <div v-bind:style="{ display: phoneNumberAsUsername && !phoneVerified ? 'block' : 'none', marginTop: '2rem' }">
            <#-- BUTTON: send code -->
            <div v-bind:style="{ display: !isCodeSent ? 'block' : 'none' }">
              <input tabindex="0" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!}"
                type="button" v-model="sendButtonText" :disabled='sendButtonText !== initSendButtonText' v-on:click="sendVerificationCode()" />
            </div>

            <div class="${properties.kcFormGroupClass!}" v-bind:style="{ display: isCodeSent ? 'block' : 'none' }">
              <label for="code" class="${properties.kcLabelClass!}">${msg("enterCode")}</label>

              <!-- INPUT: verification code -->
              <div v-otp-input>
                <div id="otp-input">
                  <input
                    type="text"
                    maxlength="1"
                    pattern="[0-9]*"
                    inputmode="numeric"
                    autocomplete="off"
                    placeholder="_"
                    v-for="(n, index) in 6"
                    :key="index"
                  />
                </div>
                <input
                  type="text"
                  name="code"
                  id="code"
                  autocomplete="one-time-code"
                  inputmode="numeric"
                  style="position: absolute; left: -9999px;"
                />
              </div>

              <#if messagesPerField.existsError('code')>
                <div id="input-error-code" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                  ${kcSanitize(messagesPerField.getFirstError('code'))?no_esc}
                </div>
              </#if>

              <!-- BUTTON: confirm code (submit) -->
              <div style="margin-top: 30px;">
                <div id="kc-form-buttons">
                  <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg('confirmCode')}" v-on:click="confirmCode" />
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
              <input type="checkbox" id="terms_and_conditions" name="terms_and_conditions" value="Yes" required v-model="terms_and_conditions" />
              <label for="terms_and_conditions" id="terms-label"><span id="terms-prefix">${msg("termsText1")}</span>
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

          <#--  <div v-if="isSubmitAttempted && !isFormValid" class="centered-div">
            <span class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                ${msg("invalidForm")}
            </span>
          </div>  -->

          <!-- Submit Button -->
          <div id="kc-form-buttons">
            <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
              type="submit" value="${msg('doRegisterBtn')}" />
          </div>
          <#--  <span v-if="!isFormValid" id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
            ${msg("invalidForm")}
          </span>  -->
        </div>

        <div id="kc-form-options">
          <span><a href="${url.loginUrl}">${kcSanitize(msg("backToLoginBtn"))?no_esc}</a></span>
        </div>
      </form>
    </div>

    <script type="text/javascript">
      new Vue({
        el: '#vue-app',
        data: {
          email: '${register.formData.email!}',
          phoneNumber: '${register.formData.phoneNumber!}',
          phoneNumberAsUsername: ${(register.formData.phoneNumberAsUsername!false)?string},
          phoneVerified: <#if phoneVerified?? && phoneVerified>true<#else>false</#if>,
          sendButtonText: '${msg("sendVerificationCode")}',
          initSendButtonText: '${msg("sendVerificationCode")}',
          messagePhoneNumberError: <#if messagesPerField.existsError('phoneNumber')>'${kcSanitize(messagesPerField.getFirstError('phoneNumber'))?no_esc}'<#else>''</#if>,
          messageEmailError: <#if messagesPerField.existsError('email')>'${kcSanitize(messagesPerField.getFirstError('email'))?no_esc}'<#else>''</#if>,
          resetSendCodeButton: false,
          KC_HTTP_RELATIVE_PATH: <#if KC_HTTP_RELATIVE_PATH?has_content>'${KC_HTTP_RELATIVE_PATH}'<#else>''</#if>,
          terms_and_conditions: false,
          isCodeSent: ${(register.formData.isCodeSent!false)?string},
          isPasswordValid: false,
          isPasswordConfirmValid: false,
          isFormValid: false,
          isSubmitAttempted: false,
        },
        computed: {
          maskedPhoneNumber() {
            if (!this.phoneNumber) return '';
            return this.phoneNumber.substring(0, 3) + ' **** ' +
                  this.phoneNumber.substring(this.phoneNumber.length - 2);
          },
          messageCodeSent() {
            const format = '${msg("codeSent")}'; // '{0} has been verified'
            return format.replace('{0}', this.maskedPhoneNumber);
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
                  this.disableSend(res.data.expires_in);
                  this.clearMessages();
                  this.isCodeSent = true;
                })
              .catch(e => this.messagePhoneNumberError = e.response.data.error);
          },
          disableSend(seconds) {
            if (this.resetSendCodeButton) {
              this.sendButtonText = this.initSendButtonText;
              this.resetSendCodeButton = false;
              return;
            }

            if (seconds <= 0) {
              this.sendButtonText = this.initSendButtonText;
            } else {
              const minutes = Math.floor(seconds / 60) + '';
              const seconds_ = seconds % 60 + '';
              this.sendButtonText = String(minutes.padStart(2, '0') + ":" + seconds_.padStart(2, '0'));
              setTimeout(() => {
                this.disableSend(seconds - 1);
              }, 1000);
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

            if (this.sendButtonText !== this.initSendButtonText) return;
            this.req(fullPhoneNumber);
          },
          confirmCode(){
            // auto check terms and conditions when verify code (prevent validation error)
            this.terms_and_conditions = "Yes";

             // submit the form
            this.$refs.form.submit();
          },
          onSubmit(event) {
            this.isSubmitAttempted = true;

            event.preventDefault(); // Prevent the default form submission

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
              // Validate the password and terms and conditions
              const isValid = this.isPasswordValid && this.isPasswordConfirmValid && this.terms_and_conditions;
              this.isFormValid = isValid;
              if (!isValid) return false;
            }

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

            event.target.submit(); // Programmatically submit the form
          },
          resetPhoneVerification() {
            this.phoneVerified = false;
            this.isCodeSent = false;
            this.resetSendCodeButton = true;
            this.clearMessages();
          },
          clearAndFocusPhoneNumber() {
            this.phoneNumber = '';
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
  </#if>
</@layout.registrationLayout>
