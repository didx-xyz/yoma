<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true; section>
    <#if section = "header">
        ${msg("updatePhoneNumber")}
    <#elseif section = "form">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/css/intlTelInput.css">
      <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/intlTelInput.min.js"></script>
      <script src="${url.resourcesPath}/js/intlTelInputDirective.js"></script>
      <script src="${url.resourcesPath}/js/otp-input.directive.js"></script>

      <div id="vue-app">
        <div id="kc-form">
          <div id="kc-form-wrapper">
            <form id="kc-form-login" action="${url.loginAction}" method="post" @submit="onSubmit">
              <div class="${properties.kcFormGroupClass!}">
                <div v-bind:style="{ display: !isCodeSent ? 'block' : 'none' }">
                  <label for="phoneNumber" class="${properties.kcLabelClass!}">${msg("enterPhoneNumber")}</label>

                  <!-- INPUT: phone number -->
                  <input id="phoneNumber" class="${properties.kcInputClass!}" name="phoneNumber" type="tel" placeholder="+27"
                    aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" autocomplete="mobile tel"
                    v-model="phoneNumber" @input="resetPhoneVerification" v-intl-tel-input />
                </div>

                <#-- LABEL: code send success -->
                <div v-if="isCodeSent" class="form-label" aria-live="polite" style="color: green;">
                  <span style="margin-right: 5px;">✅</span> {{ messageCodeSent }}
                </div>

                <#-- LABEL: code send error -->
                <div v-if="messageSendCodeError" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                  {{ messageSendCodeError }}
                </div>

                <#if messagesPerField.existsError('phoneNumber')>
                  <span id="input-error-phone" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                    ${kcSanitize(messagesPerField.getFirstError('phoneNumber'))?no_esc}
                  </span>
                </#if>

                <div style="margin-top: 0.8rem">
                  <#-- LINK: change phone number -->
                  <div v-if="isCodeSent" class="form-link" v-on:click="clearAndFocusPhoneNumber" tabindex="0">
                    <span class="icon">🔃</span>
                    <span class="text">${msg("changePhoneNumber")}</span>
                  </div>
                </div>
              </div>

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
              </div>

              <div v-bind:style="{ display: isCodeSent ? 'block' : 'none'}">
                <div id="kc-form-buttons">
                  <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                  <input tabindex="0" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                    name="save" id="kc-login" type="submit" value="${msg('doSubmit')}"/>
                </div>
              </div>

              <#-- cancel button -->
              <div id="kc-form-options" style="text-align: center;">
                <input type="hidden" id="cancel" name="cancel" v-model="cancel">
                <button class="form-link" tabindex="0" @click="() => { cancel = true; $event.target.closest('form').submit(); }">
                  <span class="text">${msg("doCancel")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <script type="text/javascript">
        const app = new Vue({
          el: '#vue-app',
          data: {
            phoneNumber: '',
            sendButtonText: '${msg("sendVerificationCode")}',
            initSendButtonText: '${msg("sendVerificationCode")}',
            messageSendCodeSuccess: '',
            messageSendCodeError: '',
            resetSendCodeButton: false,
            KC_HTTP_RELATIVE_PATH: <#if KC_HTTP_RELATIVE_PATH?has_content>'${KC_HTTP_RELATIVE_PATH}'<#else>''</#if>,
            isCodeSent: false,
            cancel: false,
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
          },
          methods: {
            req(phoneNumber) {
              const params = { params: { phoneNumber } };
              axios.get(window.location.origin + this.KC_HTTP_RELATIVE_PATH + '/realms/${realm.name}/sms/verification-code', params)
                .then(res =>
                  {
                    this.disableSend(res.data.expires_in);
                    this.clearMessages();
                    this.isCodeSent = true;
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
            onSubmit() {
              event.preventDefault(); // Prevent the default form submission

              const input = document.querySelector('#phoneNumber');
              const iti = intlTelInput.getInstance(input);
              const fullPhoneNumber = iti.getNumber();

              // Set the field value for the full phone number (this ensures the country code is always included)
              input.value = fullPhoneNumber;

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
              this.messageSendCodeError = '';

              // clear server error messages
              const inputErrorPhone = document.querySelector('#input-error-phone');
              const inputErrorCode = document.querySelector('#input-error-code');

              if (inputErrorPhone) inputErrorPhone.style.display = 'none';
              if (inputErrorCode) inputErrorCode.style.display = 'none';
            },
          }
        });
      </script>
      <#-- <#elseif section = "info">
        ${msg("updatePhoneNumberInfo")} -->
    </#if>
</@layout.registrationLayout>
