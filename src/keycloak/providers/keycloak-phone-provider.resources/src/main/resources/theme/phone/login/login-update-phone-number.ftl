<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=!messagesPerField.existsError('code','phoneNumber'); section>
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
            <form ref="form" id="kc-form-login" action="${url.loginAction}" method="post" @submit="onSubmit">

              <input type="hidden" id="codeSendStatus" name="codeSendStatus" v-model="codeSendStatus">
              <input type="hidden" id="codeExpiresIn" name="codeExpiresIn" v-model="codeExpiresIn">

              <div class="${properties.kcFormGroupClass!}">
                <div v-bind:style="{ display: codeSendStatus === 'NOT_SENT' ? 'block' : 'none' }">
                  <label for="phoneNumber" class="${properties.kcLabelClass!}">${msg("enterPhoneNumber")}</label>

                  <!-- INPUT: phone number -->
                  <input id="phoneNumber" class="${properties.kcInputClass!}" name="phoneNumber" type="tel"
                    aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" autocomplete="mobile tel" autofocus
                    v-model="phoneNumber" @input="resetPhoneVerification" v-intl-tel-input />
                </div>

                <#-- LABEL: phone number error -->
                <div v-if="messagePhoneNumberError" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                  {{ messagePhoneNumberError }}
                </div>

                <#-- ALERT: code send status -->
                <div v-if="codeSendStatus !== 'NOT_SENT' && !messagePhoneNumberError"
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

                <div class="links">
                  <#-- BUTTON: change phone number / send again (start over) -->
                  <div v-if="codeSendStatus !== 'NOT_SENT'">
                    <button type="button" class="link" v-if="codeSendStatus === 'EXPIRED'" v-on:click="clearAndFocusPhoneNumber(false)" tabindex="0">
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
                  v-otp-input="{ onSubmit: onSubmit }"
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
              </div>

              <div v-bind:style="{ display: codeSendStatus !== 'NOT_SENT' ? 'block' : 'none'}">
                <div id="kc-form-buttons">
                  <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>

                  <!-- submit button -->
                  <input tabindex="0" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                    name="save" id="kc-login" type="submit" v-model="submitButtonText" v-bind:disabled="submitButtonText != submitButtonDefaultText" />
                </div>
              </div>

              <#-- cancel button -->
              <div id="kc-form-options" style="text-align: center;">
                <input type="hidden" id="cancel" name="cancel" v-model="cancel">
                <button class="link" tabindex="0" @click="() => { cancel = true; $event.target.closest('form').submit(); }">
                  <span class="link-text">${msg("doCancel")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <script type="text/javascript">
        const CODE_SEND_STATUS = {
          NOT_SENT: 'NOT_SENT',
          SENT: 'SENT',
          ALREADY_SENT: 'ALREADY_SENT',
          ERROR: 'ERROR',
          EXPIRED: 'EXPIRED'
        };

        const app = new Vue({
          el: '#vue-app',
          data: {
            phoneNumber: '${phoneNumber!}',
            messagePhoneNumberError: <#if messagesPerField.existsError('phoneNumber')>'${kcSanitize(messagesPerField.getFirstError('phoneNumber'))?no_esc}'<#else>''</#if>,
            submitButtonText: "${msg('doSubmit')}",
            submitButtonDefaultText: "${msg('doSubmit')}",
            resetSendCodeButton: false,
            KC_HTTP_RELATIVE_PATH: <#if KC_HTTP_RELATIVE_PATH?has_content>'${KC_HTTP_RELATIVE_PATH}'<#else>''</#if>,
            codeSendStatus: <#if codeSendStatus??>'${codeSendStatus}'<#else>'NOT_SENT'</#if>,
            codeExpiresIn: <#if codeExpiresIn??>${codeExpiresIn}<#else>0</#if>,
            cancel: false,
          },
          mounted() {
              if (this.codeExpiresIn > 0) {
                  this.countDownExpiresIn(this.codeExpiresIn);
              }
          },
          computed: {
            maskedPhoneNumber() {
              if (!this.phoneNumber) return '';
              return this.phoneNumber.substring(0, 3) + ' **** ' + this.phoneNumber.substring(this.phoneNumber.length - 2);
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
          },
          methods: {
            req(phoneNumber) {
              const params = { params: { phoneNumber } };
              axios.get(window.location.origin + this.KC_HTTP_RELATIVE_PATH + '/realms/${realm.name}/sms/verification-code', params)
                .then(res =>
                  {
                    // set code send status to SENT
                    this.codeSendStatus = CODE_SEND_STATUS.SENT;

                    this.countDownExpiresIn(res.data.expires_in);
                    this.clearMessages();
                  })
                  .catch(e => {
                    if (e?.response?.status === 400) {
                        // set code send status to ALREADY_SENT
                        this.codeSendStatus = CODE_SEND_STATUS.ALREADY_SENT;

                        this.countDownExpiresIn(e.response.data.error || 300); // 5 minutes default

                        return;
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
            onSubmit() {
              event.preventDefault(); // Prevent the default form submission

              const input = document.querySelector('#phoneNumber');
              const iti = intlTelInput.getInstance(input);
              const fullPhoneNumber = iti.getNumber();

              // Set the field value for the full phone number (this ensures the country code is always included)
              input.value = fullPhoneNumber;

              // set the codeExpiresIn hidden input to the current expiration time
              document.querySelector('#codeExpiresIn').value = this.codeExpiresIn;

              // submit the form
              this.$refs.form.submit();

              // show button loading state
              this.submitButtonText = "${msg('loading')}";
            },
            resetPhoneVerification() {
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
      <#-- <#elseif section = "info">
        ${msg("updatePhoneNumberInfo")} -->
    </#if>
</@layout.registrationLayout>
