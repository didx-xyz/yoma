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
          <script src="${url.resourcesPath}/js/otp-input.directive.js"></script>
          <script src="${url.resourcesPath}/js/passwordEnhancementsDirective.js"></script>

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
              <form id="kc-form-login" class="${properties.kcFormClass!}"
                action="${url.loginAction}" method="post" @submit="onSubmit">
                <#if !usernameHidden?? && supportPhone??>
                  <input type="hidden" id="phoneActivated" name="phoneActivated" v-model="phoneActivated">
                  <input type="hidden" id="isCodeSent" name="isCodeSent" v-model="isCodeSent">
                </#if>

                <div <#if !usernameHidden?? && supportPhone??> v-if="!phoneActivated" </#if>>
                  <#if !usernameHidden??>
                    <div class="${properties.kcFormGroupClass!}">
                      <label class="${properties.kcLabelClass!}">${msg("username")}</label>

                      <input tabindex="0" id="username" class="${properties.kcInputClass!}" name="username" type="text" autocomplete="username"
                        aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>" placeholder="${msg('enterEmailOrPhoneNumber')}"
                        v-model="username" />

                      <!-- Error messages -->
                      <#if messagesPerField.existsError('username','password')>
                        <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                          ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                        </span>
                      </#if>
                    </div>
                  </#if>

                  <div class="${properties.kcFormGroupClass!}">
                    <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>

                    <div class="password-container">
                      <input tabindex="0" id="password" class="${properties.kcInputClass!}" name="password" type="password" autocomplete="current-password"
                        aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>" placeholder="${msg('enterPassword')}"
                        v-password-enhancements="{ allowToggle: true, allowCopy: false, allowPasswordIndicator: false }" />
                    </div>

                    <#if usernameHidden?? && messagesPerField.existsError('username','password')>
                      <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                        ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                      </span>
                    </#if>
                  </div>

                  <#-- LINK: use phone -->
                  <div class="form-link" v-on:click="phoneActivated = true" tabindex="0">
                    <span class="icon">📲</span>
                    <span class="text">${msg("signInWithPhone")}</span>
                  </div>
                </div>

                <#if !usernameHidden?? && supportPhone??>
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
                        <#-- LINK: use password -->
                        <div v-if="!isCodeSent" class="form-link" v-on:click="phoneActivated = false" tabindex="0">
                          <span class="icon">🔑</span>
                          <span class="text">${msg("signInWithPassword")}</span>
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

                <div v-bind:style="{ display: !phoneActivated || (phoneActivated && isCodeSent) ? 'block' : 'none'}">
                  <#--  <#if realm.rememberMe && !usernameHidden??>
                    <div class="centered-div">
                      <div class="centered-checkbox">
                        <input
                          type="checkbox"
                          id="rememberMe"
                          name="rememberMe"
                          tabindex="0"
                          <#if login.rememberMe??>checked</#if>
                        />
                        <label for="rememberMe" id="rememberMe-label" class="centered-label">
                          ${msg("rememberMe")}
                        </label>
                      </div>
                    </div>
                  </#if>  -->

                  <div id="kc-form-buttons">
                    <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if> />
                    <input tabindex="0" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" name="login" id="kc-login" type="submit" value="${msg('doLogIn')}" />
                  </div>
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
                  username: '${login.username!}' ,
                  phoneNumber: '${attemptedPhoneNumber!}',
                  phoneActivated: <#if attemptedPhoneActivated??>true<#else>false</#if>,
                  sendButtonText: '${msg("sendVerificationCode")}',
                  initSendButtonText: '${msg("sendVerificationCode")}',
                  messagePhoneNumberError: <#if messagesPerField.existsError('phoneNumber')>'${kcSanitize(messagesPerField.getFirstError('phoneNumber'))?no_esc}'<#else>''</#if>,
                  KC_HTTP_RELATIVE_PATH: <#if KC_HTTP_RELATIVE_PATH?has_content>'${KC_HTTP_RELATIVE_PATH}'<#else>''</#if>,
                  resetSendCodeButton: false,
                  isCodeSent: <#if isCodeSent??>true<#else>false</#if>,
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
                    axios.get(window.location.origin + this.KC_HTTP_RELATIVE_PATH + '/realms/${realm.name}/sms/authentication-code', params)
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
                  onSubmit(event) {
                    event.preventDefault(); // Prevent the default form submission

                    if (!this.phoneActivated) {
                      // ensure valid phone number is entered
                      const input = document.querySelector('#username');
                      const username = input.value.trim();
                      // use the phone number input (sms code tab) to validate the user name
                      const iti = intlTelInput.getInstance(document.querySelector('#phoneNumber'));
                      // Set the input value to the new email value for validation
                      iti.setNumber(username);

                      // Validate the phone number using ITI
                      if (iti.isValidNumber()) {
                        // set the field value for the full phone number (this ensures the country code is always included)
                        document.querySelector('#username').value = iti.getNumber();
                      }

                      // ensure password inputs are of type "password" (toggle password)
                      const password = document.querySelector('#password');
                      if (password.type === "text") {
                        password.type = "password";
                      }
                    }
                    else
                    {
                      // check if phone number is valid
                      const input = document.querySelector('#phoneNumber');
                      const iti = intlTelInput.getInstance(input);
                      const fullPhoneNumber = iti.getNumber();

                      // Validate phone number
                      if (!iti.isValidNumber()) {
                        this.messagePhoneNumberError = '${msg("invalidPhoneNumber")}';
                        return;
                      }

                      // Set the field value for the full phone number (this ensures the country code is always included)
                      input.value = fullPhoneNumber;
                    }

                    event.target.submit(); // Programmatically submit the form
                  },
                  resetPhoneVerification() {
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
        </#if>
        <#elseif section = "info" >
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
          <div id="kc-registration-container" style="margin">
            <a id="kc-registration" href="${url.registrationUrl}">
              ${msg("noAccount")} ${msg("doRegister")}
            </a>
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
