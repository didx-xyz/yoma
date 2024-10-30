<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password','code','phoneNumber') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        ${msg("loginAccountTitle")}
    <#elseif section = "form">
        <#if !usernameHidden?? && supportPhone??>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/css/intlTelInput.css">
          <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/intlTelInput.min.js"></script>
          <script src="${url.resourcesPath}/js/intlTelInputDirective.js"></script>
           <script src="${url.resourcesPath}/js/togglePasswordDirective.js"></script>

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
            <#if realm.password>
              <form id="kc-form-login" class="${properties.kcFormClass!}" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                <#if !usernameHidden?? && supportPhone??>
                  <!-- Tabs: Email or Phone Number Selection -->
                  <div class="${properties.kcFormGroupClass!}">
                    <ul class="nav nav-pills nav-justified">
                      <li role="presentation" v-bind:class="{ active: !phoneActivated }" v-on:click="phoneActivated = false">
                        <a href="#" tabindex="0">${msg("loginByPassword")}</a>
                      </li>
                      <li role="presentation" v-bind:class="{ active: phoneActivated }" v-on:click="phoneActivated = true">
                        <a href="#" tabindex="0">${msg("loginByPhone")}</a>
                      </li>
                    </ul>
                  </div>

                  <input type="hidden" id="phoneActivated" name="phoneActivated" v-model="phoneActivated">
                </#if>

                <div <#if !usernameHidden?? && supportPhone??> v-if="!phoneActivated" </#if>>
                  <#if !usernameHidden??>
                    <div class="${properties.kcFormGroupClass!}">
                      <label class="${properties.kcLabelClass!}">
                        <input type="checkbox" hidden="true" id="phoneNumberAsUsername" name="phoneNumberAsUsername" v-model="phoneNumberAsUsername" :true-value="true" :false-value="false" class="styled-checkbox">
                        <span :class="{'underline': phoneNumberAsUsername}"> ${msg("email")}</span> or <span :class="{'underline': !phoneNumberAsUsername}">${msg("phoneNumber")}</span>
                      </label>

                      <div :style="{ display: phoneNumberAsUsername ? 'none' : 'block' }">
                        <#if !usernameHidden??>
                          <input tabindex="0" id="email" class="${properties.kcInputClass!}" name="email" v-model="email" type="email" autofocus autocomplete="off"
                            aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>" placeholder="${msg('enterEmail')}" />
                        </#if>
                      </div>

                      <div :style="{ display: phoneNumberAsUsername ? 'block' : 'none' }">
                        <input id="phoneNumberPicker" class="${properties.kcInputClass!}" name="phoneNumberPicker" type="tel" placeholder="${msg('enterPhoneNumber')}"
                          aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" v-model="phoneNumber" v-intl-tel-input autocomplete="mobile tel" />
                      </div>

                      <!-- Error messages -->
                      <#if messagesPerField.existsError('username','phoneNumber','password')>
                        <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                          ${kcSanitize(messagesPerField.getFirstError('username','phoneNumber','password'))?no_esc}
                        </span>
                      </#if>

                      <!-- Hidden input for email or phone number -->
                      <input type="hidden" id="username" name="username" />
                      <input type="hidden" id="phoneNumber" name="phoneNumber" />
                    </div>
                  </#if>

                  <div class="${properties.kcFormGroupClass!}">
                    <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>

                    <div class="password-container">
                      <i class="fa fa-eye-slash" id="toggle-password" v-toggle-password="{ passwordSelector: '#password' }" tabindex="0"></i>
                      <input tabindex="0" id="password" class="${properties.kcInputClass!}" name="password" type="password" autocomplete="off"
                        aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>" placeholder="${msg('enterPassword')}" />
                    </div>
                    <#--  <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>
                    <input tabindex="0" id="password" class="${properties.kcInputClass!}" name="password" type="password" autocomplete="off"
                      aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>" placeholder="${msg('enterPassword')}" />  -->

                    <#if usernameHidden?? && messagesPerField.existsError('username','password')>
                      <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                        ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                      </span>
                    </#if>
                  </div>
                </div>

                <#if !usernameHidden?? && supportPhone??>
                  <div :style="{ display: phoneActivated ? 'block' : 'none' }">
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

                <div class="${properties.kcFormGroupClass!} ${properties.kcFormSettingClass!}">
                  <div id="kc-form-options">
                    <#if realm.rememberMe && !usernameHidden??>
                      <div class="checkbox">
                        <label>
                          <#if login.rememberMe??>
                            <input tabindex="0" id="rememberMe" name="rememberMe" type="checkbox" checked> ${msg("rememberMe")}
                          <#else>
                            <input tabindex="0" id="rememberMe" name="rememberMe" type="checkbox"> ${msg("rememberMe")}
                          </#if>
                        </label>
                      </div>
                    </#if>
                  </div>
                </div>

                <div id="kc-form-buttons">
                  <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if> />
                  <input tabindex="0" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" name="login" id="kc-login" type="submit" value="${msg("doLogIn")}" />
                </div>

                <div id="kc-form-options">
                  <div class="${properties.kcFormOptionsWrapperClass!}">
                    <#if realm.resetPasswordAllowed>
                      <div class="${properties.kcFormOptionsWrapperClass!}">
                        <span><a tabindex="0" href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a></span>
                      </div>
                    </#if>
                  </div>
                </div>
              </form>
            </#if>
          </div>
        </div>

        <#if !usernameHidden?? && supportPhone??>
          <script type="text/javascript">
            new Vue({
                el: '#vue-app',
                data: {
                    phoneNumber: <#if attemptedPhoneActivated??>'${attemptedPhoneNumber!}'<#elseif attemptedPhoneNumberAsUsername??>'${login.username!}'<#else>''</#if>,
                    phoneActivated: <#if attemptedPhoneActivated??>true<#else>false</#if>,
                    sendButtonText: '${msg("sendVerificationCode")}',
                    initSendButtonText: '${msg("sendVerificationCode")}',
                    messageSendCodeSuccess: '',
                    messageSendCodeError: '',
                    phoneNumberAsUsername: <#if attemptedPhoneNumberAsUsername??>true<#else>false</#if>,
                    email: <#if !attemptedPhoneNumberAsUsername??>'${login.username!}'<#else>''</#if>,
                    KC_HTTP_RELATIVE_PATH: <#if KC_HTTP_RELATIVE_PATH?has_content>'${KC_HTTP_RELATIVE_PATH}'<#else>''</#if>,
                },
                methods: {
                  req(phoneNumber) {
                    const params = { params: { phoneNumber } };
                    axios.get(window.location.origin + this.KC_HTTP_RELATIVE_PATH + '/realms/${realm.name}/sms/authentication-code', params)
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

                      // Set the hidden field value for the full phone number or email
                      if (this.phoneNumberAsUsername) {
                          document.getElementById('username').value = fullPhoneNumber;
                      } else {
                          document.getElementById('username').value = this.email.trim();
                      }
                      document.getElementById('phoneNumberAsUsername').value = this.phoneNumberAsUsername;
                  },
                  resetPhoneVerification() {
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
                  document.getElementById('kc-form-login').addEventListener('submit', this.onSubmit);
                  document.getElementById('phoneNumberPicker').addEventListener('input', this.resetPhoneVerification);
                }
            });
          </script>
        </#if>
        <#elseif section = "info" >
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
          <div id="kc-registration-container">
              <div id="kc-registration">
                  <span>${msg("noAccount")}
                  <a tabindex="0" href="${url.registrationUrl}">${msg("doRegister")}</a></span>
              </div>
          </div>
        </#if>
        <#elseif section = "socialProviders" >
        <#if realm.password && social.providers??>
          <div id="kc-social-providers" class="${properties.kcFormSocialAccountSectionClass!}">
              <hr/>
              <h4>${msg("identity-provider-login-label")}</h4>
              <ul class="${properties.kcFormSocialAccountListClass!} <#if social.providers?size gt 3>${properties.kcFormSocialAccountListGridClass!}</#if>">
                  <#list social.providers as p>
                      <a id="social-${p.alias}" class="${properties.kcFormSocialAccountListButtonClass!} <#if social.providers?size gt 3>${properties.kcFormSocialAccountGridItem!}</#if>"
                         type="button" href="${p.loginUrl}">
                          <#if p.iconClasses?has_content>
                              <i class="${properties.kcCommonLogoIdP!} ${p.iconClasses!}" aria-hidden="true"></i>
                              <span class="${properties.kcFormSocialAccountNameClass!} kc-social-icon-text">${p.displayName!}</span>
                          <#else>
                              <span class="${properties.kcFormSocialAccountNameClass!}">${p.displayName!}</span>
                          </#if>
                      </a>
                  </#list>
              </ul>
          </div>
        </#if>
    </#if>
</@layout.registrationLayout>
