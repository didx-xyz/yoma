<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm','phoneNumber','code'); section>
  <#if section="header">
    ${msg("registerTitle")}
  <#elseif section="form">
    <!-- Include necessary CSS and JS files -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/css/intlTelInput.css">
    <link rel="stylesheet" type="text/css" href="${url.resourcesPath}/css/passwordIndicator.css">
    <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="${url.resourcesPath}/js/passwordIndicator.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/intlTelInput.min.js"></script>
    <script src="${url.resourcesPath}/js/intlTelInputDirective.js"></script>

    <div id="vue-app">
      <form id="kc-register-form" class="${properties.kcFormClass!}" action="${url.registrationAction}" method="post">
        <!-- Error message display -->
        <#--  <div class="alert-error ${properties.kcAlertClass!} pf-m-danger" v-show="messageSendCodeError">
          <div class="pf-c-alert__icon">
            <span class="${properties.kcFeedbackErrorIcon!}"></span>
          </div>
          <span class="${properties.kcAlertTitleClass!}">{{ messageSendCodeError }}</span>
        </div>  -->

        <!-- First Name Input -->
        <#--  <div class="${properties.kcFormGroupClass!}">
          <div class="${properties.kcLabelWrapperClass!}">
            <label for="firstName" class="${properties.kcLabelClass!}">${msg("firstName")}</label> *
          </div>
          <div class="${properties.kcInputWrapperClass!}">
            <input type="text" id="firstName" class="${properties.kcInputClass!}" name="firstName"
              value="${(register.formData.firstName!'')}"
              aria-invalid="<#if messagesPerField.existsError('firstName')>true</#if>" />
            <#if messagesPerField.existsError('firstName')>
              <span id="input-error-firstname" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                ${kcSanitize(messagesPerField.get('firstName'))?no_esc}
              </span>
            </#if>
          </div>
        </div>  -->

        <!-- Last Name Input -->
        <#--  <div class="${properties.kcFormGroupClass!}">
          <div class="${properties.kcLabelWrapperClass!}">
            <label for="lastName" class="${properties.kcLabelClass!}">${msg("lastName")}</label> *
          </div>
          <div class="${properties.kcInputWrapperClass!}">
            <input type="text" id="lastName" class="${properties.kcInputClass!}" name="lastName"
              value="${(register.formData.lastName!'')}"
              aria-invalid="<#if messagesPerField.existsError('lastName')>true</#if>" />
            <#if messagesPerField.existsError('lastName')>
              <span id="input-error-lastname" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                ${kcSanitize(messagesPerField.get('lastName'))?no_esc}
              </span>
            </#if>
          </div>
        </div>  -->

        <!-- Phone Number or Email Selection -->
        <label class="${properties.kcLabelClass!}">
          <input type="checkbox" hidden="true" id="phoneNumberAsUsername" name="phoneNumberAsUsername" v-model="phoneNumberAsUsername" :true-value="true" :false-value="false" class="styled-checkbox">
          <span :class="{'underline': phoneNumberAsUsername}"> ${msg("email")}</span> or <span :class="{'underline': !phoneNumberAsUsername}">${msg("phoneNumber")}</span>
        </label>

        <!-- Email Input -->
        <div class="${properties.kcFormGroupClass!}" :style="{ display: phoneNumberAsUsername ? 'none' : 'block' }">
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
        <div class="${properties.kcFormGroupClass!}" :style="{ display: phoneNumberAsUsername ? 'block' : 'none' }">
          <div class="${properties.kcInputWrapperClass!}">
            <input id="phoneNumberPicker" class="${properties.kcInputClass!}" name="phoneNumberPicker" type="tel" placeholder="${msg('enterPhoneNumber')}"
              aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" v-model="phoneNumber" v-intl-tel-input autocomplete="mobile tel" />
          </div>
          <#if messagesPerField.existsError('phoneNumber')>
            <span id="input-error-phone" class="${properties.kcInputErrorMessageClass!}" aria-live="polite" style="padding-left: 20px;">
              ${kcSanitize(messagesPerField.getFirstError('phoneNumber'))?no_esc}
            </span>
          </#if>
          <!-- Hidden input for phone number -->
          <input type="hidden" id="phoneNumber" name="phoneNumber" />
        </div>

        <!-- Verification Code Input -->
        <#if verifyPhone??>
          <div :style="{ display: phoneNumberAsUsername ? 'block' : 'none' }">
            <div class="${properties.kcFormGroupClass!}" :style="{ display: phoneVerified ? 'block' : 'none' }">
              <div class="${properties.kcLabelWrapperClass!}" style="margin-top: -10px">
                <label class="${properties.kcLabelClass!}" style="color: green;"><span style="margin-right: 5px;">✔</span> ${msg("phoneNumberVerified")}</label>
              </div>
                <#--  <a href="#" v-on:click="resetPhoneVerification">${msg("changePhoneNumber")}</a>  -->
            </div>
            <div class="${properties.kcFormGroupClass!}" :style="{ display: phoneVerified ? 'none' : 'block' }">
              <div class="${properties.kcLabelWrapperClass!}">
                <label for="code" class="${properties.kcLabelClass!}">${msg("verificationCode")}</label>
              </div>

              <div class="${properties.kcInputWrapperClass!}" style="padding: 0 40px 0px 44px;">
                <div style="display: flex; padding: 0px 13px 10px 10px;">
                  <input tabindex="0" type="text" id="code" name="code" aria-invalid="<#if messagesPerField.existsError('code')>true</#if>"
                    class="${properties.kcInputClass!}" autocomplete="off" placeholder="${msg('enterCode')}" style="flex: 2; margin-right: 10px;" />
                  <input tabindex="0" style="height: 36px; flex: 1;margin-top: 5px;" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                    type="button" v-model="sendButtonText" :disabled='sendButtonText !== initSendButtonText' v-on:click="sendVerificationCode()" />
                </div>
              </div>

              <#-- message: success -->
              <div v-if="messageSendCodeSuccess" class="${properties.kcInputErrorMessageClass!}" aria-live="polite" style="color: green; padding-left: 20px; margin-top: -10px;">
                <span style="margin-right: 5px;">✔</span> {{ messageSendCodeSuccess }}
              </div>

              <#-- message: error -->
              <div v-if="messageSendCodeError" class="${properties.kcInputErrorMessageClass!}" aria-live="polite" style="padding-left: 20px; margin-top: -10px;">
                <span style="margin-right: 5px;">❌</span> {{ messageSendCodeError }}
              </div>

              <#if messagesPerField.existsError('code')>
                <div id="input-error-code" class="${properties.kcInputErrorMessageClass!}" aria-live="polite" style="padding-left: 20px;">
                  ${kcSanitize(messagesPerField.getFirstError('code'))?no_esc}
                </div>
              </#if>
            </div>
          </div>
        </#if>

        <!-- Password Inputs -->
        <#if passwordRequired??>
          <div class="${properties.kcFormGroupClass!}">
            <div class="${properties.kcLabelWrapperClass!}">
              <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label> *
              <div id="password-instructions">${msg("passwordInstructions")}</div>
            </div>
            <div class="${properties.kcInputWrapperClass!}">
              <div class="password-container">
                <i class="fa fa-eye-slash" id="toggle-password" onclick="togglePassword('#register-password', '#toggle-password')"></i>
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
              <div id="password-requirements">
                <div id="label">Password requirements:</div>
                <p id="length">10 Characters Long</p>
                <p id="lowercase">1 lower case</p>
                <p id="uppercase">1 UPPER CASE</p>
                <p id="number">1 Numb3r</p>
                <p id="email">Different from email</p>
              </div>
            </div>
          </div>
          <div class="${properties.kcFormGroupClass!}">
            <div class="${properties.kcLabelWrapperClass!}">
              <label for="password-confirm" class="${properties.kcLabelClass!}">${msg("passwordConfirm")}</label> *
            </div>
            <div class="${properties.kcInputWrapperClass!}">
              <div class="password-confirm-container">
                <i class="fa fa-eye-slash" id="toggle-password-confirm" onclick="togglePassword('#password-confirm', '#toggle-password-confirm')"></i>
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
            <input type="checkbox" id="terms_and_conditions" name="terms_and_conditions" value="Yes" required />
            <label for="terms" id="terms-label"><span id="terms-prefix">${msg("termsText1")}</span>
              <a href="https://app.yoma.world/terms-and-conditions" target="_blank" id="terms-text">${msg("termsText2")}</a>
            </label>
          </div>
        </div>

        <!-- Recaptcha -->
        <#if recaptchaRequired??>
          <div class="form-group">
            <div class="${properties.kcInputWrapperClass!}">
              <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
            </div>
          </div>
        </#if>

        <!-- Submit Button -->
        <div class="${properties.kcFormGroupClass!}">
          <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
            <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("doRegisterBtn")}" />
          </div>
          <div id="kc-form-options" class="${properties.kcFormOptionsClass!}" style="padding-top: 15px;">
            <div class="${properties.kcFormOptionsWrapperClass!}">
              <span><a href="${url.loginUrl}">${kcSanitize(msg("backToLoginBtn"))?no_esc}</a></span>
            </div>
          </div>
        </div>
      </form>
    </div>

    <!-- Vue.js Script -->
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
          resetSendCodeButton: false
        },
        methods: {
          req(phoneNumber) {
            const params = { params: { phoneNumber } };
            axios.get(window.location.origin + '/realms/${realm.name}/sms/registration-code', params)
              .then(res =>
                {
                  this.disableSend(res.data.expires_in);

                  // show success message
                  this.clearMessages();
                  const phoneNumberPartial = phoneNumber.substring(0, 3) + '****' + phoneNumber.substring(phoneNumber.length - 2);
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
          initializePasswordIndicator() {
            document.getElementById('email').addEventListener('input', (e) => {
              passwordIndicator("${url.resourcesPath}", '#email', '#register-password');
            });
            document.getElementById('register-password').addEventListener('input', (e) => {
              passwordIndicator("${url.resourcesPath}", '#email', '#register-password');
            });
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
          this.initializePasswordIndicator();
          document.getElementById('kc-register-form').addEventListener('submit', this.onSubmit);
          document.getElementById('phoneNumberPicker').addEventListener('input', this.resetPhoneVerification);
        }
      });
    </script>
  </#if>
</@layout.registrationLayout>
