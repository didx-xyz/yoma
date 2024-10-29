<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=!messagesPerField.existsError('username','code','phoneNumber'); section>
    <#if section = "header">
        ${msg("emailForgotTitle")}
    <#elseif section = "form">

        <#if supportPhone??>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/css/intlTelInput.css">
            <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/intlTelInput.min.js"></script>
            <script src="${url.resourcesPath}/js/intlTelInputDirective.js"></script>

            <style>
                [v-cloak] > * {
                    display: none;
                }

                [v-cloak]::before {
                    content: "loading...";
                }
            </style>
        </#if>

        <div id="vue-app">
            <div v-cloak>
                <form id="kc-reset-password-form" class="${properties.kcFormClass!}" action="${url.loginAction}" method="post">
                    <#if supportPhone??>
                        <div class="alert-error ${properties.kcAlertClass!} pf-m-danger" v-show="errorMessage">
                                <div class="pf-c-alert__icon">
                                    <span class="${properties.kcFeedbackErrorIcon!}"></span>
                                </div>

                                <span class="${properties.kcAlertTitleClass!}">{{ errorMessage }}</span>
                        </div>

                        <div class="${properties.kcFormGroupClass!}">
                          <ul class="nav nav-pills nav-justified">
                              <li role="presentation" v-bind:class="{ active: !phoneActivated }"
                                  v-on:click="phoneActivated = false"><a
                                          href="#">${msg("email")}</a>
                              </li>
                              <li role="presentation" v-bind:class="{ active: phoneActivated }"
                                  v-on:click="phoneActivated = true"><a href="#">${msg("phoneNumber")}</a>
                              </li>
                          </ul>
                        </div>

                        <input type="hidden" id="phoneActivated" name="phoneActivated" v-model="phoneActivated">
                    </#if>

                    <div <#if supportPhone??> v-if="!phoneActivated" </#if> >
                        <div class="${properties.kcFormGroupClass!}">
                          <label for="username" class="${properties.kcLabelClass!}">${msg("email")}</label>

                          <input type="text" id="username" name="username" class="${properties.kcInputClass!}"
                                 value="${(auth.attemptedUsername!'')}"
                                 aria-invalid="<#if messagesPerField.existsError('username')>true</#if>"
                                 placeholder="${msg('enterEmail')}"
                                 autofocus autocomplete="email" />
                          <#if messagesPerField.existsError('username')>
                              <span id="input-error-username" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                ${kcSanitize(messagesPerField.get('username'))?no_esc}
                              </span>
                          </#if>
                        </div>
                    </div>

                    <#if supportPhone??>
                      <div v-if="phoneActivated">
                        <div class="${properties.kcFormGroupClass!}">
                          <label for="phoneNumberPicker" class="${properties.kcLabelClass!}">${msg("phoneNumber")}</label>

                          <input id="phoneNumberPicker" class="${properties.kcInputClass!}" name="phoneNumberPicker" type="tel" placeholder="${msg('enterPhoneNumber')}"
                            aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" v-model="phoneNumber" v-intl-tel-input autocomplete="mobile tel" />

                          <#if messagesPerField.existsError('phoneNumber')>
                            <span id="input-error-phone" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                              ${kcSanitize(messagesPerField.getFirstError('phoneNumber'))?no_esc}
                            </span>
                          </#if>

                          <!-- Hidden input for phone number -->
                          <input type="hidden" id="phoneNumber" name="phoneNumber" />
                        </div>

                        <div class="${properties.kcFormGroupClass!}">
                          <label for="code" class="${properties.kcLabelClass!}">${msg("verificationCode")}</label>

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
                    </#if>

                    <div id="kc-form-buttons">
                        <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                               type="submit" value="${msg('doSubmit')}"/>
                    </div>
                    <div id="kc-form-options" class="${properties.kcFormOptionsClass!}">
                        <div class="${properties.kcFormOptionsWrapperClass!}">
                            <span><a href="${url.loginUrl}">${msg("goBack")} ${kcSanitize(msg("doLogIn"))?no_esc}</span>
                        </div>
                    </div>

                </form>
            </div>
        </div>

        <#if supportPhone??>
          <script type="text/javascript">
            new Vue({
              el: '#vue-app',
              data: {
                errorMessage: '',
                phoneActivated: <#if attemptedPhoneActivated??>true<#else>false</#if>,
                phoneNumber: '${attemptedPhoneNumber!}',
                sendButtonText: '${msg("sendVerificationCode")}',
                initSendButtonText: '${msg("sendVerificationCode")}',
                messageSendCodeSuccess: '',
                messageSendCodeError: '',
                KC_HTTP_RELATIVE_PATH: <#if KC_HTTP_RELATIVE_PATH?has_content>'${KC_HTTP_RELATIVE_PATH}'<#else>''</#if>,
              },
              methods: {
                req(phoneNumber) {
                  const params = { params: { phoneNumber } };
                  axios.get(window.location.origin + this.KC_HTTP_RELATIVE_PATH + '/realms/${realm.name}/sms/reset-code', params)
                    .then(res =>
                      {
                        this.disableSend(res.data.expires_in);

                        // show success message
                        this.clearMessages();
                        const phoneNumberPartial = phoneNumber.substring(0, 3) + ' **** ' + phoneNumber.substring(phoneNumber.length - 2);
                        var format = '${msg("codeSent")}'; // 'A code has been sent to {0}.';
                        this.messageSendCodeSuccess = format.replace('{0}', phoneNumberPartial);
                      })
                    .catch(e => this.messageSendCodeError = e.response.data.error);
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

                  // Set the field value for the full phone number (this ensures the country code is always included)
                  document.getElementById('phoneNumber').value = fullPhoneNumber;
                },
                resetPhoneVerification() {
                  this.phoneVerified = false;
                  this.messageSendCodeSuccess = '';
                  this.resetSendCodeButton = true;
                  this.clearMessages();
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
                document.getElementById('kc-reset-password-form').addEventListener('submit', this.onSubmit);
                document.getElementById('phoneNumberPicker').addEventListener('input', this.resetPhoneVerification);
              }
            });
          </script>
        </#if>

    <#--  <#elseif section = "info" >
        <#if realm.duplicateEmailsAllowed>
            ${msg("emailInstructionUsername")}
        <#else>
            ${msg("emailInstruction")}
        </#if>
        <#if supportPhone??>
            ${msg("phoneInstruction")}
        </#if>  -->
    </#if>
</@layout.registrationLayout>
