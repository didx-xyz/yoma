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
          <script src="${url.resourcesPath}/js/otp-input.directive.js"></script>

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
                <form id="kc-reset-password-form" class="${properties.kcFormClass!}" action="${url.loginAction}"
                  method="post" @submit="onSubmit">
                    <#if supportPhone??>
                      <div class="alert-error ${properties.kcAlertClass!} pf-m-danger" v-show="errorMessage">
                        <div class="pf-c-alert__icon">
                            <span class="${properties.kcFeedbackErrorIcon!}"></span>
                        </div>

                        <span class="${properties.kcAlertTitleClass!}">{{ errorMessage }}</span>
                      </div>

                      <input type="hidden" id="phoneActivated" name="phoneActivated" v-model="phoneActivated">
                      <input type="hidden" id="isCodeSent" name="isCodeSent" v-model="isCodeSent">
                    </#if>

                    <div <#if supportPhone??> v-if="!phoneActivated" </#if> >
                      <div class="${properties.kcFormGroupClass!}">
                        <label for="username" class="${properties.kcLabelClass!}">${msg("enterEmail")}</label>

                        <input type="text" id="username" name="username" class="${properties.kcInputClass!}"
                          value="${(auth.attemptedUsername!'')}"
                          aria-invalid="<#if messagesPerField.existsError('username')>true</#if>"
                          placeholder="example@email.com"
                          autofocus autocomplete="email"
                          v-model="email" />

                        <#if messagesPerField.existsError('username')>
                          <span id="input-error-username" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                            ${kcSanitize(messagesPerField.get('username'))?no_esc}
                          </span>
                        </#if>

                        <div style="margin-top: 0.8rem">
                          <#-- LINK: use phone -->
                          <div class="form-link" v-on:click="phoneActivated = true" tabindex="0">
                            <span class="icon">📲</span>
                            <span class="text">${msg("resetWithPhone")}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <#if supportPhone??>
                      <div :style="{ display: phoneActivated ? 'block' : 'none' }">
                        <div class="${properties.kcFormGroupClass!}">
                          <div v-bind:style="{ display: !isCodeSent ? 'block' : 'none' }">
                            <label for="phoneNumber" class="${properties.kcLabelClass!}">${msg("enterPhoneNumber")}</label>

                            <!-- INPUT: phone number -->
                            <input id="phoneNumber" class="${properties.kcInputClass!}" name="phoneNumber" type="tel" placeholder="+27"
                              aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" autocomplete="mobile tel"
                              v-model="phoneNumber" @input="resetPhoneVerification" v-intl-tel-input />
                          </div>

                          <#-- LABEL: phone number error -->
                          <div v-if="messagePhoneNumberError" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                            {{ messagePhoneNumberError }}
                          </div>

                          <#-- LABEL: code send success -->
                          <span v-if="isCodeSent && !phoneVerified && !messagePhoneNumberError" aria-live="polite" style="color: green;">
                            <span style="margin-right: 5px;">✅</span> {{ messageCodeSent }}
                          </span>

                          <div style="margin-top: 0.8rem">
                            <#-- LINK: use email -->
                            <div v-if="!isCodeSent" class="form-link" v-on:click="phoneActivated = false" tabindex="0">
                              <span class="icon">📩</span>
                              <span class="text">${msg("resetWithEmail")}</span>
                            </div>

                            <#-- LINK: change phone number -->
                            <div v-if="isCodeSent" class="form-link" v-on:click="clearAndFocusPhoneNumber" tabindex="0">
                              <span class="icon">🔃</span>
                              <span class="text">${msg("changePhoneNumber")}</span>
                            </div>
                          </div>
                        </div>

                        <div v-bind:style="{ display: phoneActivated ? 'block' : 'none', marginTop: '2rem' }">
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
                        </div>
                      </div>
                    </#if>

                    <div v-bind:style="{ display: !phoneActivated || (phoneActivated && isCodeSent) ? 'block' : 'none', marginTop: '2rem'}">
                      <div id="kc-form-buttons">
                          <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                            type="submit" value="${msg('doSubmit')}"/>
                      </div>
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
                email: '',
                sendButtonText: '${msg("sendVerificationCode")}',
                initSendButtonText: '${msg("sendVerificationCode")}',
                messagePhoneNumberError: <#if messagesPerField.existsError('phoneNumber')>'${kcSanitize(messagesPerField.getFirstError('phoneNumber'))?no_esc}'<#else>''</#if>,
                KC_HTTP_RELATIVE_PATH: <#if KC_HTTP_RELATIVE_PATH?has_content>'${KC_HTTP_RELATIVE_PATH}'<#else>''</#if>,
                resetSendCodeButton: false,
                isCodeSent: ${isCodeSent!},
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
                  axios.get(window.location.origin + this.KC_HTTP_RELATIVE_PATH + '/realms/${realm.name}/sms/reset-code', params)
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
                }
              }
            });
          </script>
        </#if>

      <#--<#elseif section = "info" >
        <#if realm.duplicateEmailsAllowed>
            ${msg("emailInstructionUsername")}
        <#else>
            ${msg("emailInstruction")}
        </#if>
        <#if supportPhone??>
            ${msg("phoneInstruction")}
        </#if>-->
    </#if>
</@layout.registrationLayout>
