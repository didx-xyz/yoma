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

      <div id="vue-app">
          <div class="alert-error ${properties.kcAlertClass!} pf-m-danger" v-show="errorMessage">
              <div class="pf-c-alert__icon">
                  <span class="${properties.kcFeedbackErrorIcon!}"></span>
              </div>

              <span class="${properties.kcAlertTitleClass!}">{{ errorMessage }}</span>
          </div>

        <div id="kc-form">
          <div id="kc-form-wrapper">
            <form id="kc-form-login" action="${url.loginAction}" method="post">
              <div class="${properties.kcFormGroupClass!}">
                <div class="${properties.kcLabelWrapperClass!}">
                  <label for="phoneNumberPicker" class="${properties.kcLabelClass!}">${msg("phoneNumber")}</label>
                </div>
                <div class="${properties.kcInputWrapperClass!}">
                  <input id="phoneNumberPicker" class="${properties.kcInputClass!}" name="phoneNumberPicker" type="tel" placeholder="${msg('enterPhoneNumber')}"
                    aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" v-model="phoneNumber" v-intl-tel-input autocomplete="mobile tel" />
                </div>
                <#if messagesPerField.existsError('phoneNumber')>
                  <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                    ${kcSanitize(messagesPerField.getFirstError('phoneNumber'))?no_esc}
                  </span>
                </#if>
                <!-- Hidden input for phone number -->
                <input type="hidden" id="phoneNumber" name="phoneNumber" />
              </div>

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
                </div>

                <#if messagesPerField.existsError('code')>
                    <div id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                        ${kcSanitize(messagesPerField.getFirstError('code'))?no_esc}
                    </div>
                </#if>
              </div>

              <div id="kc-form-buttons" class="${properties.kcFormGroupClass!}">
                <input type="hidden" id="id-hidden-input" name="credentialId"
                       <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                <input tabindex="0"
                       class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                       name="save" id="kc-login" type="submit" value="${msg("doSubmit")}"/>
              </div>
            </form>
          </div>
        </div>
      </div>

      <script type="text/javascript">
        const app = new Vue({
          el: '#vue-app',
          data: {
            errorMessage: '',
            phoneNumber: '',
            sendButtonText: '${msg("sendVerificationCode")}',
            initSendButtonText: '${msg("sendVerificationCode")}',
            KC_HTTP_RELATIVE_PATH: <#if KC_HTTP_RELATIVE_PATH?has_content>'${KC_HTTP_RELATIVE_PATH}'<#else>''</#if>,
          },
          methods: {
            req(phoneNumber) {
              const params = { params: { phoneNumber } };
              axios.get(window.location.origin + this.KC_HTTP_RELATIVE_PATH + '/realms/${realm.name}/sms/verification-code', params)
                .then(res => this.disableSend(res.data.expires_in))
                .catch(e => this.errorMessage = e.response.data.error);
            },
            disableSend(seconds) {
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
              this.errorMessage = '';
              const input = document.querySelector('#phoneNumberPicker');
              const iti = intlTelInput.getInstance(input);
              const fullPhoneNumber = iti.getNumber();

              // Validate phone number
              if (!iti.isValidNumber()) {
                this.errorMessage = '${msg("invalidPhoneNumber")}';
                return;
              }

              // Validate phone number
              //const phoneRegex = /^\+?\d+$/;
              //if (!phoneRegex.test(phoneNumberPartial)) {
              //  this.errorMessage = 'Invalid phone number format.';
              //  return;
              //}

              if (this.sendButtonText !== this.initSendButtonText) return;
              this.req(fullPhoneNumber);
            },
            onSubmit() {
              const input = document.querySelector('#phoneNumberPicker');
              const iti = intlTelInput.getInstance(input);
              const fullPhoneNumber = iti.getNumber();

              // Set the field value for the full phone number (this ensures the country code is always included)
              document.getElementById('phoneNumber').value = fullPhoneNumber;
            },
          },
          mounted() {
            document.getElementById('kc-form-login').addEventListener('submit', this.onSubmit);
          },
        });
      </script>
    <#elseif section = "info">
        ${msg("updatePhoneNumberInfo")}
    </#if>
</@layout.registrationLayout>
