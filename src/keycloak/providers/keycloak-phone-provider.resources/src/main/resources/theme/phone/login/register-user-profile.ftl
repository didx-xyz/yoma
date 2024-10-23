<#import "template.ftl" as layout>
  <@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm','phoneNumber','code'); section>
    <#if section="header">
      ${msg("registerTitle")}
      <#elseif section="form">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/css/intlTelInput.css">
        <link rel="stylesheet" type="text/css" href="${url.resourcesPath}/css/passwordIndicator.css">
        <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
        <script src="${url.resourcesPath}/js/passwordIndicator.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/intlTelInput.min.js"></script>
        <script src="${url.resourcesPath}/js/intlTelInputDirective.js"></script>

        <div id="vue-app">
          <form id="kc-register-form" class="${properties.kcFormClass!}" action="${url.registrationAction}" method="post">
            <div class="alert-error ${properties.kcAlertClass!} pf-m-danger" v-show="errorMessage">
              <div class="pf-c-alert__icon">
                <span class="${properties.kcFeedbackErrorIcon!}"></span>
              </div>
              <span class="${properties.kcAlertTitleClass!}">{{ errorMessage }}
              </span>
            </div>
            <div class="${properties.kcFormGroupClass!}">
              <div class="${properties.kcLabelWrapperClass!}">
                <label for="firstName" class="${properties.kcLabelClass!}">
                  ${msg("firstName")}
                </label> *
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
            </div>
            <div class="${properties.kcFormGroupClass!}">
              <div class="${properties.kcLabelWrapperClass!}">
                <label for="lastName" class="${properties.kcLabelClass!}">
                  ${msg("lastName")}
                </label> *
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
            </div>

            <label class="${properties.kcLabelClass!}">
                <input type="checkbox" hidden="true" id="phoneNumberAsUsername" name="phoneNumberAsUsername" v-model="phoneNumberAsUsername" :true-value="true" :false-value="false" class="styled-checkbox">
                <span :class="{'underline': phoneNumberAsUsername}"> ${msg("email")}</span> or <span :class="{'underline': !phoneNumberAsUsername}">${msg("phoneNumber")}</span>
            </label>

            <div class="${properties.kcFormGroupClass!}" :style="{ display: phoneNumberAsUsername ? 'none' : 'block' }">
              <#--  <div class="${properties.kcLabelWrapperClass!}">
                <label for="email" class="${properties.kcLabelClass!}">
                  ${msg("email")}
                </label>
              </div>  -->
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

            <div class="${properties.kcFormGroupClass!}" :style="{ display: phoneNumberAsUsername ? 'block' : 'none' }">
              <#--  <div class="${properties.kcLabelWrapperClass!}">
                <label for="phoneNumberPicker" class="${properties.kcLabelClass!}">${msg("phoneNumber")}</label>
              </div>  -->
              <div class="${properties.kcInputWrapperClass!}">
                <input id="phoneNumberPicker" class="${properties.kcInputClass!}" name="phoneNumberPicker" type="tel" placeholder="${msg('enterPhoneNumber')}"
                  aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" v-model="phoneNumber" v-intl-tel-input autocomplete="mobile tel" />
              </div>
              <#if messagesPerField.existsError('phoneNumber')>
                <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite" style="padding-left: 20px;">
                  ${kcSanitize(messagesPerField.getFirstError('phoneNumber'))?no_esc}
                </span>
              </#if>
              <!-- Hidden input for phone number -->
              <input type="hidden" id="phoneNumber" name="phoneNumber" />
            </div>

            <#if verifyPhone??>
              <div class="${properties.kcFormGroupClass!}" :style="{ display: phoneNumberAsUsername ? 'block' : 'none' }">
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

                <#if messagesPerField.existsError('code')>
                    <div id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite" style="padding-left: 20px;">
                        ${kcSanitize(messagesPerField.getFirstError('code'))?no_esc}
                    </div>
                </#if>
              </div>
            </#if>

            <#if passwordRequired??>
                <div class="${properties.kcFormGroupClass!}">
                  <div class="${properties.kcLabelWrapperClass!}">
                    <label for="password" class="${properties.kcLabelClass!}">
                      ${msg("password")}
                    </label> *
                    <div id="password-instructions">
                      ${msg("passwordInstructions")}
                    </div>
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
                    <label for="password-confirm"
                      class="${properties.kcLabelClass!}">
                      ${msg("passwordConfirm")}
                    </label> *
                  </div>
                  <div class="${properties.kcInputWrapperClass!}">
                    <div class="password-confirm-container">
                      <i class="fa fa-eye-slash" id="toggle-password-confirm" onclick="togglePassword('#password-confirm', '#toggle-password-confirm')"></i>
                      <input type="password" id="password-confirm" class="${properties.kcInputClass!}"
                        name="password-confirm"
                        aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>"
                        placeholder="${msg('confirmPassword')}"/>
                    </div>
                    <#if messagesPerField.existsError('password-confirm')>
                      <span id="input-error-password-confirm" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                        ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                      </span>
                    </#if>
                  </div>
                </div>
            </#if>

            <!-- Terms and conditions -->
            <div class="centered-div">
                <div class="centered-checkbox">
                  <input
                    type="checkbox"
                    id="terms_and_conditions"
                    name="terms_and_conditions"
                    value="Yes"
                    required />
                  <label for="terms" id="terms-label"><span id="terms-prefix">
                      ${msg("termsText1")}
                    </span>
                    <a href="https://app.yoma.world/terms-and-conditions" target="_blank" id="terms-text">
                      ${msg("termsText2")}
                    </a>
                  </label>
                </div>
            </div>

            <#if recaptchaRequired??>
                <div class="form-group">
                  <div class="${properties.kcInputWrapperClass!}">
                    <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
                  </div>
                </div>
            </#if>

            <div class="${properties.kcFormGroupClass!}">
                <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                  <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("doRegisterBtn")}" />
                </div>
                <div id="kc-form-options" class="${properties.kcFormOptionsClass!}" style="padding-top: 15px;">
                  <div class="${properties.kcFormOptionsWrapperClass!}">
                    <span><a href="${url.loginUrl}">
                        ${kcSanitize(msg("backToLoginBtn"))?no_esc}
                      </a></span>
                  </div>
                </div>
            </div>
          </form>
        </div>

        <script type="text/javascript">
          new Vue({
            el: '#vue-app',
            data: {
              errorMessage: '',
              phoneNumber: '${register.formData.phoneNumber!}',
              phoneNumberAsUsername: '${register.formData.phoneNumberAsUsername!}',
              sendButtonText: '${msg("sendVerificationCode")}',
              initSendButtonText: '${msg("sendVerificationCode")}'
            },
            methods: {
              req(phoneNumber) {
                const params = { params: { phoneNumber } };
                axios.get(window.location.origin + '/realms/${realm.name}/sms/registration-code', params)
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

                if (this.phoneNumberAsUsername) {
                  // Set the field value for the full phone number (this ensures the country code is always included)
                  document.getElementById('phoneNumber').value = fullPhoneNumber;
                }
              },
              initializePasswordIndicator() {
                document.getElementById('email').addEventListener('input', (e) => {
                  passwordIndicator("${url.resourcesPath}", '#email', '#register-password');
                });
                document.getElementById('register-password').addEventListener('input', (e) => {
                  passwordIndicator("${url.resourcesPath}", '#email', '#register-password');
                });
              }
            },
            mounted() {
              this.initializePasswordIndicator();
              document.getElementById('kc-register-form').addEventListener('submit', this.onSubmit);
            }
          });
        </script>
    </#if>
  </@layout.registrationLayout>
