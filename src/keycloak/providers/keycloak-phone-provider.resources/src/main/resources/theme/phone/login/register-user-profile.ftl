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
    <script src="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/intlTelInput.min.js"></script>
    <script src="${url.resourcesPath}/js/intlTelInputDirective.js"></script>

    <div id="vue-app">
      <form id="kc-register-form" class="${properties.kcFormClass!}" action="${url.registrationAction}" method="post">
        <!-- Tabs: Email or Phone Number Selection -->
        <div class="${properties.kcFormGroupClass!}">
          <div class="${properties.kcLabelWrapperClass!}">
            <ul class="nav nav-pills nav-justified">
              <li role="presentation" v-bind:class="{ active: !phoneNumberAsUsername }" v-on:click="phoneNumberAsUsername = false">
                <a href="#" tabindex="0">${msg("email")}</a>
              </li>
              <li role="presentation" v-bind:class="{ active: phoneNumberAsUsername }" v-on:click="phoneNumberAsUsername = true">
                <a href="#" tabindex="0">${msg("phone")}</a>
              </li>
            </ul>
          </div>
        </div>

        <input type="hidden" id="phoneNumberAsUsername" name="phoneNumberAsUsername" v-model="phoneNumberAsUsername" :true-value="true" :false-value="false">

        <!-- Email Input -->
        <div class="${properties.kcFormGroupClass!}" v-bind:style="{ display: phoneNumberAsUsername ? 'none' : 'block' }">
          <div class="${properties.kcLabelWrapperClass!}">
            <label for="username" class="${properties.kcLabelClass!}">${msg("email")}</label>
          </div>

          <div class="${properties.kcInputWrapperClass!}">
            <input type="text" id="email" class="${properties.kcInputClass!}" name="email"
              value="${(register.formData.email!'')}" autocomplete="email"
              aria-invalid="<#if messagesPerField.existsError('email')>true</#if>" placeholder="${msg('enterEmail')}" />
            <#if messagesPerField.existsError('email')>
              <span id="input-error-email" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                ${kcSanitize(messagesPerField.get('email'))?no_esc}
              </span>
            </#if>
          </div>
        </div>

        <!-- Phone Number Input -->
        <div class="${properties.kcFormGroupClass!}" v-bind:style="{ display: phoneNumberAsUsername ? 'block' : 'none' }">
          <div class="${properties.kcLabelWrapperClass!}">
            <label for="phoneNumberPicker" class="${properties.kcLabelClass!}">${msg("phoneNumber")}</label>
          </div>

          <div class="${properties.kcInputWrapperClass!}">
            <input id="phoneNumberPicker" class="${properties.kcInputClass!}" name="phoneNumberPicker" type="tel" placeholder="${msg('enterPhoneNumber')}"
              aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" v-model="phoneNumber" v-intl-tel-input autocomplete="mobile tel"
              :disabled="phoneVerified" />
            <#if messagesPerField.existsError('phoneNumber')>
              <span id="input-error-phone" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                ${kcSanitize(messagesPerField.getFirstError('phoneNumber'))?no_esc}
              </span>
            </#if>
          </div>

          <input type="hidden" id="phoneNumber" name="phoneNumber" />

          <div class="${properties.kcLabelWrapperClass!}">
            <label class="${properties.kcLabelClass!}" v-bind:style="{ display: phoneVerified ? 'block' : 'none' }">
              <span style="color: green;"><span style="margin-right: 5px;">✔</span> ${msg("phoneNumberVerified")}</span>
              <span v-on:click="clearAndFocusPhoneNumberPicker" class="underline" tabindex="0">${msg("changePhoneNumber")}</span>
            </label>
          </div>
        </div>

        <#if verifyPhone??>
          <div v-bind:style="{ display: phoneNumberAsUsername && !phoneVerified ? 'block' : 'none' }">
            <!-- Verification Code Input -->
            <div class="${properties.kcFormGroupClass!}">
              <div class="${properties.kcLabelWrapperClass!}">
                  <label for="code" class="${properties.kcLabelClass!}">${msg("verificationCode")}</label>
              </div>

              <div class="${properties.kcInputWrapperClass!}">
                  <div style="display: flex; gap: 10px;">
                    <input tabindex="0" type="text" id="code" name="code" aria-invalid="<#if messagesPerField.existsError('code')>true</#if>"
                      class="${properties.kcInputClass!}" autocomplete="off" placeholder="${msg('enterCode')}" style="flex: 2;" />

                    <input tabindex="0" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!}" style="width: 120px;"
                      type="button" v-model="sendButtonText" :disabled='sendButtonText !== initSendButtonText' v-on:click="sendVerificationCode()" />
                  </div>
                  <div v-if="messageSendCodeSuccess" class="${properties.kcInputErrorMessageClass!}" aria-live="polite" style="color: green;">
                    <span style="margin-right: 5px;">✔</span> {{ messageSendCodeSuccess }}
                  </div>
                  <div v-if="messageSendCodeError" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                    {{ messageSendCodeError }}
                  </div>
                  <#if messagesPerField.existsError('code')>
                    <div id="input-error-code" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                      ${kcSanitize(messagesPerField.getFirstError('code'))?no_esc}
                    </div>
                  </#if>
              </div>
            </div>

            <!-- Verify Code (Submit Button) -->
            <div class="${properties.kcFormGroupClass!}">
              <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg('verifyCode')}" v-on:click="verifyCode" />
              </div>
            </div>
          </div>
        </#if>

        <!-- Password Inputs -->
        <#if passwordRequired??>
          <div class="${properties.kcFormGroupClass!}">
            <div class="${properties.kcLabelWrapperClass!}">
              <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>
            </div>
            <div class="${properties.kcInputWrapperClass!}">
              <div class="password-container">
                <i class="fa fa-eye-slash" id="toggle-password" onclick="togglePassword('#register-password', '#toggle-password')" tabindex="0"></i>
                <input type="password" id="register-password" class="${properties.kcInputClass!}" name="password"
                  autocomplete="new-password"
                  aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>"
                  placeholder="${msg('enterPassword')}" />
              </div>

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
          </div>
          <div class="${properties.kcFormGroupClass!}">
            <div class="${properties.kcLabelWrapperClass!}">
              <label for="password-confirm" class="${properties.kcLabelClass!}">${msg("passwordConfirm")}</label>
            </div>
            <div class="${properties.kcInputWrapperClass!}">
              <div class="password-confirm-container">
                <i class="fa fa-eye-slash" id="toggle-password-confirm" onclick="togglePassword('#password-confirm', '#toggle-password-confirm')" tabindex="0"></i>
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
        <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
          <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("doRegisterBtn")}" />
        </div>
        <div id="kc-form-options" class="${properties.kcFormOptionsClass!}">
          <div class="${properties.kcFormOptionsWrapperClass!}">
            <span><a href="${url.loginUrl}">${kcSanitize(msg("backToLoginBtn"))?no_esc}</a></span>
          </div>
        </div>
      </form>
    </div>

    <script type="text/javascript">
      new Vue({
        el: '#vue-app',
        data: {
          phoneNumber: '${register.formData.phoneNumber!}',
          phoneNumberAsUsername: '${register.formData.phoneNumberAsUsername!}',
          phoneVerified: <#if phoneVerified?? && phoneVerified>true<#else>false</#if>,
          sendButtonText: '${msg("sendVerificationCode")}',
          initSendButtonText: '${msg("sendVerificationCode")}',
          messageSendCodeSuccess: '',
          messageSendCodeError: '',
          resetSendCodeButton: false,
          KC_HTTP_RELATIVE_PATH: <#if KC_HTTP_RELATIVE_PATH?has_content>'${KC_HTTP_RELATIVE_PATH}'<#else>''</#if>,
          terms_and_conditions: false
        },
        methods: {
          req(phoneNumber) {
            const params = { params: { phoneNumber } };
            axios.get(window.location.origin + this.KC_HTTP_RELATIVE_PATH + '/realms/${realm.name}/sms/registration-code', params)
              .then(res =>
                {
                  this.disableSend(res.data.expires_in);

                  // show success message
                  this.clearMessages();
                  const phoneNumberPartial = phoneNumber.substring(0, 3) + ' **** ' + phoneNumber.substring(phoneNumber.length - 2);
                  this.messageSendCodeSuccess = 'A code has been sent to ' + phoneNumberPartial + '.';
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
            const input = document.querySelector('#phoneNumberPicker');
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
          verifyCode(){
            // auto check terms and conditions when verify code (prevent validation error)
            this.terms_and_conditions = "Yes";
          },
          onSubmit() {
            const input = document.querySelector('#phoneNumberPicker');
            const iti = intlTelInput.getInstance(input);
            const fullPhoneNumber = iti.getNumber();

            // set hidden input value with country code
            if (this.phoneNumberAsUsername) {
              document.getElementById('phoneNumber').value = fullPhoneNumber;
            }
          },
          resetPhoneVerification() {
            this.phoneVerified = false;
            this.messageSendCodeSuccess = '';
            this.resetSendCodeButton = true;
            this.clearMessages();
          },
          clearAndFocusPhoneNumberPicker() {
            this.phoneNumber = '';
            const phoneNumberPicker = document.getElementById('phoneNumberPicker');
            if (phoneNumberPicker) {
              phoneNumberPicker.focus();
            }

            this.resetPhoneVerification();
          },
          clearMessages() {
            this.messageSendCodeSuccess = '';
            this.messageSendCodeError = '';

            // clear server error messages
            const inputErrorPhone = document.getElementById('input-error-phone');
            const inputErrorCode = document.getElementById('input-error-code');

            if (inputErrorPhone) inputErrorPhone.style.display = 'none';
            if (inputErrorCode) inputErrorCode.style.display = 'none';
          }
        },
        mounted() {
          document.getElementById('kc-register-form').addEventListener('submit', this.onSubmit);
          document.getElementById('phoneNumberPicker').addEventListener('input', this.resetPhoneVerification);
        }
      });
    </script>
  </#if>
</@layout.registrationLayout>
