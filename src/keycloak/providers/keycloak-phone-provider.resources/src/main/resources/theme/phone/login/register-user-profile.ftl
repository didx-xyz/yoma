<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm','phoneNumber','code'); section>
  <#if section="header">
    ${msg("registerTitle")}
  <#elseif section="form">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/css/intlTelInput.css">
    <link rel="stylesheet" type="text/css" href="${url.resourcesPath}/css/passwordIndicator.css">
    <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="${url.resourcesPath}/js/passwordIndicatorDirective.js"></script>
    <script src="${url.resourcesPath}/js/togglePasswordDirective.js"></script>
    <script src="${url.resourcesPath}/js/passwordGeneratorDirective.js"></script>
    <script src="${url.resourcesPath}/js/otp-input.directive.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/intlTelInput.min.js"></script>
    <script src="${url.resourcesPath}/js/intlTelInputDirective.js"></script>

    <div id="vue-app">
      <form id="kc-register-form" class="${properties.kcFormClass!}" action="${url.registrationAction}" method="post" @submit="onSubmit">
        <!-- Tabs: Email or Phone Number Selection -->
        <#--  <div class="${properties.kcFormGroupClass!}">
          <ul class="nav nav-pills nav-justified">
            <li role="presentation" v-bind:class="{ active: !phoneNumberAsUsername }" v-on:click="phoneNumberAsUsername = false">
              <a href="#" tabindex="0">${msg("email")}</a>
            </li>
            <li role="presentation" v-bind:class="{ active: phoneNumberAsUsername }" v-on:click="phoneNumberAsUsername = true">
              <a href="#" tabindex="0">${msg("phone")}</a>
            </li>
          </ul>
        </div>  -->

        <input type="hidden" id="phoneNumberAsUsername" name="phoneNumberAsUsername" v-model="phoneNumberAsUsername">
        <input type="hidden" id="isCodeSent" name="isCodeSent" v-model="isCodeSent">

        <!-- Email Input -->
        <div class="${properties.kcFormGroupClass!}" v-bind:style="{ display: phoneNumberAsUsername ? 'none' : 'block' }">
          <label for="email" class="${properties.kcLabelClass!}">${msg("enterEmail")}</label>

          <input type="text" id="email" class="${properties.kcInputClass!}" name="email" placeholder="example@email.com"
            value="${(register.formData.email!'')}" autocomplete="email"
            aria-invalid="<#if messagesPerField.existsError('email')>true</#if>" />

          <#if messagesPerField.existsError('email')>
            <span id="input-error-email" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
              ${kcSanitize(messagesPerField.get('email'))?no_esc}
            </span>
          </#if>

          <#-- LINK: use phone number -->
          <a class="form-link" style="margin-top: 0.8rem" href="#" v-on:click="phoneNumberAsUsername = true" tabindex="0">
            <span class="icon">📲</span>
            <span class="text">${msg("phoneNumberAsUsername")}</span>
          </a>
        </div>

        <!-- Phone Number Input -->
        <div class="${properties.kcFormGroupClass!}" v-bind:style="{ display: phoneNumberAsUsername ? 'block' : 'none' }">
          <div v-bind:style="{ display: !isCodeSent && !phoneVerified ? 'block' : 'none' }">
            <label for="phoneNumber" class="${properties.kcLabelClass!}">${msg("enterPhoneNumber")}</label>

            <!-- INPUT: phone number -->
            <input id="phoneNumber" class="${properties.kcInputClass!}" name="phoneNumber" type="tel" placeholder="+27"
              aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" autocomplete="mobile tel"
              v-model="phoneNumber" @input="resetPhoneVerification" v-intl-tel-input :disabled="phoneVerified" />
          </div>

          <#-- LABEL: code send success -->
          <label v-if="isCodeSent && !phoneVerified" xxxclass="${properties.kcLabelClass!}" class="pf-c-form__helper-text" aria-live="polite" style="color: green;">
            <span style="margin-right: 5px;">✅</span> {{ messageCodeSent }}
          </label>

          <#-- LABEL: code send error -->
          <div v-if="messageSendCodeError" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
            {{ messageSendCodeError }}
          </div>

          <#if messagesPerField.existsError('phoneNumber')>
            <span id="input-error-phone" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
              ${kcSanitize(messagesPerField.getFirstError('phoneNumber'))?no_esc}
            </span>
          </#if>

          <#-- LABEL: phone number verified -->
          <label xxxclass="${properties.kcLabelClass!}" class="pf-c-form__helper-text" v-bind:style="{ display: phoneVerified ? 'block' : 'none' }">
            <span style="color: green;"><span style="margin-right: 5px;">✅</span> {{ messagePhoneVerified }}</span>
          </label>

          <div style="margin-top: 0.8rem">
            <#-- LINK: use email -->
            <a v-if="!isCodeSent" class="form-link" href="#" v-on:click="phoneNumberAsUsername = false" tabindex="0">
              <span class="icon">📩</span>
              <span class="text">${msg("emailAsUsername")}</span>
            </a>

            <#-- LINK: change phone number -->
            <a v-if="isCodeSent || phoneVerified" class="form-link" href="#" v-on:click="clearAndFocusPhoneNumber" tabindex="0">
              <span class="icon">🔃</span>
              <span class="text">${msg("changePhoneNumber")}</span>
            </a>
          </div>
        </div>

        <#if verifyPhone??>
          <div v-bind:style="{ display: phoneNumberAsUsername && !phoneVerified ? 'block' : 'none' }">

            <#-- BUTTON: send code -->
            <div v-bind:style="{ display: !isCodeSent ? 'block' : 'none' }">
              <input tabindex="0" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!}"
                type="button" v-model="sendButtonText" :disabled='sendButtonText !== initSendButtonText' v-on:click="sendVerificationCode()" />
            </div>

            <!-- INPUT: verification code -->
            <div class="${properties.kcFormGroupClass!}" v-bind:style="{ display: isCodeSent ? 'block' : 'none' }">
              <label for="code" class="${properties.kcLabelClass!}">${msg("enterCode")}</label>

              <#--  <input tabindex="0" type="text" id="code" name="code" aria-invalid="<#if messagesPerField.existsError('code')>true</#if>"
                class="${properties.kcInputClass!}" autocomplete="off" placeholder="${msg('enterCode')}" />  -->

              <div v-otp-input>
                <div id="otp-input">
                  <input type="text"
                    maxlength="1"
                    pattern="[0-9]*"
                    inputmode="numeric"
                    autocomplete="off"
                    placeholder="_"
                    v-for="n in 6"
                    :key="n">
                </div>
                <input type="hidden" name="code">
              </div>

              <#if messagesPerField.existsError('code')>
                <div id="input-error-code" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                  ${kcSanitize(messagesPerField.getFirstError('code'))?no_esc}
                </div>
              </#if>

              <!-- BUTTON: confirm code (submit) -->
              <div class="${properties.kcFormGroupClass!}" style="margin: 30px 0 10px 0;">
                <div id="kc-form-buttons">
                  <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg('confirmCode')}" v-on:click="confirmCode" />
                </div>
              </div>
            </div>
          </div>
        </#if>

        <div v-bind:style="{ display: !phoneNumberAsUsername || (phoneNumberAsUsername && phoneVerified) ? 'block' : 'none'}">
          <!-- Password Inputs -->
          <#if passwordRequired??>
            <#--  Generate password  -->
            <div class="${properties.kcFormGroupClass!}">
              <label class="${properties.kcLabelClass!}">${msg("createPassword")}</label>

              <#--  <div class="radio-wrapper">
                <span for="create-password-radio" class="pf-c-form__helper-text">${msg("createPasswordHelpText")}</span>
                <input type="checkbox" id="create-password-checkbox" class="checkbox" v-password-generator="{ passwordSelector: '#register-password', confirmPasswordSelector: '#password-confirm' }">
              </div>  -->
              <div class="radio-wrapper">
                <span id="createPasswordHelpText" for="create-password-radio" class="pf-c-form__helper-text">${msg("createPasswordHelpText")}</span>
                <input type="checkbox" id="create-password-checkbox" class="checkbox" v-password-generator="{ onGenerate: handleGeneratedPassword }" />
              </div>
            </div>

            <div class="${properties.kcFormGroupClass!}">
              <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>

              <div class="password-container">
                <i class="fa fa-eye-slash" id="toggle-password" v-toggle-password="{ passwordSelector: '#register-password', formSelector: '#kc-register-form' }" tabindex="0"></i>

                <input type="password" id="register-password" class="${properties.kcInputClass!}" name="password"
                  autocomplete="new-password"
                  aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>"
                  placeholder="${msg('enterPassword')}" />
              </div>

              <#-- LABEL: password generated & copied -->
              <label v-if="messagePasswordSuccess" xxxclass="${properties.kcLabelClass!}" class="pf-c-form__helper-text" aria-live="polite" style="color: green;">
                {{ messagePasswordSuccess }}
              </label>

              <#if messagesPerField.existsError('password')>
                <span id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                  ${kcSanitize(messagesPerField.get('password'))?no_esc}
                </span>
              </#if>

              <div class="password-requirements" v-password-indicator="{
                  resourcesPath: '${url.resourcesPath}',
                  passwordSelector: '#register-password',
                  labels: {
                    length: '${msg('password_requirement_length')}',
                    lowercase: '${msg('password_requirement_lowercase')}',
                    uppercase: '${msg('password_requirement_uppercase')}',
                    number: '${msg('password_requirement_number')}',
                    email: '${msg('password_requirement_email')}'
                  }
                }"></div>
            </div>

            <div id="passwordConfirmContainer" class="${properties.kcFormGroupClass!}">
              <label for="password-confirm" class="${properties.kcLabelClass!}">${msg("passwordConfirm")}</label>

              <div class="password-container">
                <i class="fa fa-eye-slash" id="toggle-password-confirm" v-toggle-password="{ passwordSelector: '#password-confirm', formSelector: '#kc-register-form' }" tabindex="0"></i>
                <input type="password" id="password-confirm" class="${properties.kcInputClass!}"
                  name="password-confirm"
                  aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>"
                  placeholder="${msg('confirmPassword')}" />
              </div>

              <#if messagesPerField.existsError('password-confirm')>
                <span id="input-error-password-confirm" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                  ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                </span>
              </#if>
            </div>
          </#if>

          <!-- Terms and Conditions -->
          <div class="centered-div">
            <div class="centered-checkbox">
              <input type="checkbox" id="terms_and_conditions" name="terms_and_conditions" value="Yes" required v-model="terms_and_conditions" />
              <label for="terms" id="terms-label"><span id="terms-prefix">${msg("termsText1")}</span>
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
            <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("doRegisterBtn")}" />
          </div>
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
          phoneNumber: '${register.formData.phoneNumber!}',
          phoneNumberAsUsername: ${(register.formData.phoneNumberAsUsername!false)?string},
          phoneVerified: <#if phoneVerified?? && phoneVerified>true<#else>false</#if>,
          sendButtonText: '${msg("sendVerificationCode")}',
          initSendButtonText: '${msg("sendVerificationCode")}',
          messageSendCodeSuccess: '',
          messageSendCodeError: '',
          messagePasswordSuccess: '',
          resetSendCodeButton: false,
          KC_HTTP_RELATIVE_PATH: <#if KC_HTTP_RELATIVE_PATH?has_content>'${KC_HTTP_RELATIVE_PATH}'<#else>''</#if>,
          terms_and_conditions: false,
          isCodeSent: ${(register.formData.isCodeSent!false)?string},
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
          }
        },
        methods: {
          req(phoneNumber) {
            const params = { params: { phoneNumber } };
            axios.get(window.location.origin + this.KC_HTTP_RELATIVE_PATH + '/realms/${realm.name}/sms/registration-code', params)
              .then(res =>
                {
                  this.disableSend(res.data.expires_in);
                  this.clearMessages();
                  this.isCodeSent = true;

                  // show success message
                  //const phoneNumberPartial = phoneNumber.substring(0, 3) + ' **** ' + phoneNumber.substring(phoneNumber.length - 2);
                  //var format = '${msg("codeSent")}'; // 'A code has been sent to {0}.';
                  //this.messageSendCodeSuccess = format.replace('{0}', phoneNumberPartial);
                })
              .catch(e => this.messageSendCodeError = e.response.data.error);
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
            this.messageSendCodeError = '';
            const input = document.querySelector('#phoneNumber');
            const iti = intlTelInput.getInstance(input);
            const fullPhoneNumber = iti.getNumber();

            // Validate phone number
            if (!iti.isValidNumber()) {
              this.messageSendCodeError = '${msg("invalidPhoneNumber")}';
              return;
            }

            if (this.sendButtonText !== this.initSendButtonText) return;
            this.req(fullPhoneNumber);
          },
          confirmCode(){
            // auto check terms and conditions when verify code (prevent validation error)
            this.terms_and_conditions = "Yes";
          },
          onSubmit() {
            event.preventDefault(); // Prevent the default form submission

            const input = document.querySelector('#phoneNumber');
            const iti = intlTelInput.getInstance(input);
            const fullPhoneNumber = iti.getNumber();

            // set hidden input value with country code
            if (this.phoneNumberAsUsername) {
              input.value = fullPhoneNumber;
              input.disabled = false;
            }

            // ensure password inputs are of type "password" (toggle password)
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
            this.messageSendCodeSuccess = '';
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
            this.messageSendCodeSuccess = '';
            this.messageSendCodeError = '';

            // clear server error messages
            const inputErrorPhone = document.querySelector('#input-error-phone');
            const inputErrorCode = document.querySelector('#input-error-code');

            if (inputErrorPhone) inputErrorPhone.style.display = 'none';
            if (inputErrorCode) inputErrorCode.style.display = 'none';
          },
          handleGeneratedPassword(generated, password) {
            const passwordInput = document.querySelector('#register-password');
            const confirmPasswordInput = document.querySelector('#password-confirm');
            const confirmPasswordContainer = document.querySelector('#passwordConfirmContainer');
            //const label = document.querySelector('#createPasswordHelpText');
            //const labelHelpText = '${msg('createPasswordHelpText')}';
            //const labelSuccessText = '${msg('createPasswordSuccessText')}';
            //const checkbox = document.querySelector('#generate-password'); // Assuming this is the checkbox id

            // clear server error messages
            const inputErrorPassword = document.querySelector('#input-error-password');
            if (inputErrorPassword) inputErrorPassword.style.display = 'none';

            if (generated) {
              // Generate & show password
              //this.ignorePasswordInputChange = true;
              passwordInput.value = password;
              passwordInput.type = "text";
              passwordInput.removeAttribute("aria-invalid");
              confirmPasswordInput.value = password;
              confirmPasswordContainer.style.display = "none";
              //label.innerText = "✔ " + '${msg('createPasswordSuccessText')}';
              //label.style.color = "green";
              this.messagePasswordSuccess = '${msg("passwordCreated")}';
            } else {
              // Clear & show fields
              //this.ignorePasswordInputChange = true;
              passwordInput.value = "";
              passwordInput.type = "password";
              passwordInput.removeAttribute("aria-invalid");
              confirmPasswordInput.value = "";
              confirmPasswordContainer.style.display = "block";
              //label.innerText = "";//labelHelpText;
              //label.style.color = "rgb(73, 80, 87)";
              this.messagePasswordSuccess = "";
            }
          },
        }
      });
    </script>
  </#if>
</@layout.registrationLayout>
