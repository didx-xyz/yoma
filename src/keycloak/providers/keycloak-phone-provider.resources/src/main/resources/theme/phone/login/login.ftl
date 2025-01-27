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
                  <input type="hidden" id="codeSendStatus" name="codeSendStatus" v-model="codeSendStatus">
                  <input type="hidden" id="codeExpiresIn" name="codeExpiresIn" v-model="codeExpiresIn">
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
                  <a v-on:click="phoneActivated = true" tabindex="0">
                    <i aria-hidden="true" class="link-icon fa fa-phone"></i>
                    <span class="link-text">${msg("signInWithPhone")}</span>
                  </a>
                </div>

                <#if !usernameHidden?? && supportPhone??>
                  <div :style="{ display: phoneActivated ? 'block' : 'none' }">
                    <div class="${properties.kcFormGroupClass!}">
                      <div v-bind:style="{ display: codeSendStatus === 'NOT_SENT' ? 'block' : 'none' }">
                        <label for="phoneNumber" class="${properties.kcLabelClass!}">${msg("enterPhoneNumber")}</label>

                        <!-- INPUT: phone number -->
                        <input id="phoneNumber" class="${properties.kcInputClass!}" name="phoneNumber" type="tel"
                          aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" autocomplete="mobile tel"
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

                      <div style="margin-top: 0.8rem">
                        <#-- LINK: use password -->
                        <a v-if="codeSendStatus === 'NOT_SENT'" v-on:click="phoneActivated = false" tabindex="0">
                          <i class="link-icon fa fa-key" aria-hidden="true"></i>
                          <span class="link-text">${msg("signInWithPassword")}</span>
                        </a>

                        <#-- LINK: change phone number / send again (start over) -->
                        <div v-if="codeSendStatus !== 'NOT_SENT'">
                          <a v-if="codeSendStatus === 'EXPIRED'" v-on:click="clearAndFocusPhoneNumber(false)" tabindex="0">
                            <i class="link-icon fa fa-undo" aria-hidden="true"></i>
                            <span class="link-text">${msg("codeSendAgain")}</span>
                          </a>
                          <a v-else v-on:click="clearAndFocusPhoneNumber(true)" tabindex="0">
                            <i class="link-icon fa fa-undo" aria-hidden="true"></i>
                            <span class="link-text">${msg("changePhoneNumber")}</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    <div v-bind:style="{ display: phoneActivated ? 'block' : 'none', marginTop: '2rem' }">
                      <#-- BUTTON: send code -->
                      <div v-bind:style="{ display: codeSendStatus === 'NOT_SENT' ? 'block' : 'none' }">
                        <input tabindex="0" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!}"
                            type="button" value="${msg('sendVerificationCode')}" v-on:click="sendVerificationCode()" />
                      </div>

                      <div class="${properties.kcFormGroupClass!}" v-bind:style="{ display: codeSendStatus !== 'NOT_SENT' ? 'block' : 'none' }">
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

                <div v-bind:style="{ display: !phoneActivated || (phoneActivated && codeSendStatus !== 'NOT_SENT') ? 'block' : 'none'}">
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
            const CODE_SEND_STATUS = {
              NOT_SENT: 'NOT_SENT',
              SENT: 'SENT',
              ALREADY_SENT: 'ALREADY_SENT',
              ERROR: 'ERROR',
              EXPIRED: 'EXPIRED'
            };

            new Vue({
                el: '#vue-app',
                data: {
                  username: '${login.username!}' ,
                  phoneNumber: '${attemptedPhoneNumber!}',
                  phoneActivated: <#if attemptedPhoneActivated??>true<#else>false</#if>,
                  //sendButtonText: '${msg("sendVerificationCode")}',
                  //initSendButtonText: '${msg("sendVerificationCode")}',
                  messagePhoneNumberError: <#if messagesPerField.existsError('phoneNumber')>'${kcSanitize(messagesPerField.getFirstError('phoneNumber'))?no_esc}'<#else>''</#if>,
                  KC_HTTP_RELATIVE_PATH: <#if KC_HTTP_RELATIVE_PATH?has_content>'${KC_HTTP_RELATIVE_PATH}'<#else>''</#if>,
                  resetSendCodeButton: false,
                  codeSendStatus: <#if codeSendStatus??>'${codeSendStatus}'<#else>'NOT_SENT'</#if>,
                  codeExpiresIn: <#if codeExpiresIn??>${codeExpiresIn}<#else>0</#if>,
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
                    axios.get(window.location.origin + this.KC_HTTP_RELATIVE_PATH + '/realms/${realm.name}/sms/authentication-code', params)
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

                    //if (this.sendButtonText !== this.initSendButtonText) return;
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

                      // set the codeExpiresIn hidden input to the current expiration time
                      document.querySelector('#codeExpiresIn').value = this.codeExpiresIn;
                    }

                    event.target.submit(); // Programmatically submit the form
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
