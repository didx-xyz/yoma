<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password','code','phoneNumber') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        ${msg("loginAccountTitle")}
    <#elseif section = "form">
        <#if !usernameHidden?? && supportPhone??>
          <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/css/intlTelInput.css">
          <script src="https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/intlTelInput.min.js"></script>

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
              <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                  <#if !usernameHidden?? && supportPhone??>
                      <div class="${properties.kcFormClass!}">
                          <div class="alert-error ${properties.kcAlertClass!} pf-m-danger" v-show="errorMessage">
                              <div class="pf-c-alert__icon">
                                  <span class="${properties.kcFeedbackErrorIcon!}"></span>
                              </div>
                              <span class="${properties.kcAlertTitleClass!}">{{ errorMessage }}</span>
                          </div>

                          <div class="${properties.kcFormGroupClass!}">
                              <div class="${properties.kcLabelWrapperClass!}">
                                  <ul class="nav nav-pills nav-justified">
                                      <li role="presentation" v-bind:class="{ active: !phoneActivated }" v-on:click="phoneActivated = false">
                                          <a href="#">${msg("loginByPassword")}</a>
                                      </li>
                                      <li role="presentation" v-bind:class="{ active: phoneActivated }" v-on:click="phoneActivated = true">
                                          <a href="#">${msg("loginByPhone")}</a>
                                      </li>
                                  </ul>
                              </div>
                          </div>
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
                                    <div class="${properties.kcFormGroupClass!}">
                                        <input tabindex="0" id="email" class="${properties.kcInputClass!}" name="email" v-model="email" type="email" autofocus autocomplete="off"
                                            aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>" placeholder="${msg('enterEmail')}" />
                                    </div>
                                </#if>
                            </div>

                            <div :style="{ display: phoneNumberAsUsername ? 'block' : 'none' }">
                                <div class="${properties.kcFormGroupClass!}">
                                    <input id="phoneNumberPicker" class="${properties.kcInputClass!}" name="phoneNumberPicker" type="tel" placeholder="${msg('enterPhoneNumber')}"
                                        aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" v-model="phoneNumber" v-intl-tel-input autocomplete="mobile tel" />
                                </div>
                            </div>

                            <#--  error messages  -->
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
                        <input tabindex="0" id="password" class="${properties.kcInputClass!}" name="password" type="password" autocomplete="off"
                              aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>" placeholder="${msg('enterPassword')}" />

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
                            <div class="${properties.kcLabelWrapperClass!}" style="padding: 0">
                              <label for="phoneNumber" class="${properties.kcLabelClass!}">${msg("phoneNumber")}</label>
                            </div>

                            <input id="phoneNumberPicker" class="${properties.kcInputClass!}" name="phoneNumberPicker" type="tel" placeholder="${msg('enterPhoneNumber')}"
                                  aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" v-model="phoneNumber" v-intl-tel-input autocomplete="mobile tel" />

                            <#if messagesPerField.existsError('phoneNumber')>
                                <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                    ${kcSanitize(messagesPerField.getFirstError('phoneNumber'))?no_esc}
                                </span>
                            </#if>
                        </div>

                        <!-- Hidden input for phone number -->
                        <input type="hidden" id="phoneNumber" name="phoneNumber" />

                        <div class="${properties.kcFormGroupClass!}">
                            <label for="code" class="${properties.kcLabelClass!}">${msg("verificationCode")}</label>

                            <div class="${properties.kcLabelWrapperClass!}" style="padding: 0 0 0px 25px;">
                                <div style="display: flex; padding: 0px 13px 10px 10px;">
                                    <input tabindex="0" type="text" id="code" name="code" aria-invalid="<#if messagesPerField.existsError('code')>true</#if>"
                                          class="${properties.kcInputClass!}" autocomplete="off" placeholder="${msg('enterCode')}" style="flex: 2; margin-right: 10px;" />
                                    <input tabindex="0" style="height: 36px; flex: 1;margin-top: 5px;" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                                          type="button" v-model="sendButtonText" :disabled='sendButtonText !== initSendButtonText' v-on:click="sendVerificationCode()" />
                                </div>
                            </div>

                            <#if messagesPerField.existsError('code')>
                                <div id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
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
                      <div class="${properties.kcFormOptionsWrapperClass!}">
                          <#if realm.resetPasswordAllowed>
                              <span><a tabindex="0" href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a></span>
                          </#if>
                      </div>
                  </div>

                  <div id="kc-form-buttons" class="${properties.kcFormGroupClass!}">
                      <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if> />
                      <input tabindex="0" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" name="login" id="kc-login" type="submit" value="${msg("doLogIn")}" />
                  </div>
              </form>
            </#if>
          </div>
        </div>

        <#if !usernameHidden?? && supportPhone??>
          <script type="text/javascript">
            Vue.directive('intl-tel-input', {
              inserted(el) {
                intlTelInput(el, {
                  loadUtilsOnInit: "https://cdn.jsdelivr.net/npm/intl-tel-input@24.6.0/build/js/utils.js",
                  onlyCountries: ['za'], // only South Africa for now
                  initialCountry: "auto",
                  geoIpLookup: callback => {
                    fetch("https://ipapi.co/json")
                      .then(res => res.json())
                      .then(data => callback(data.country_code))
                      .catch(() => callback("za"));
                  }
                });
              }
            });

            new Vue({
                el: '#vue-app',
                data: {
                    errorMessage: '',
                    phoneNumber: <#if attemptedPhoneActivated??>'${attemptedPhoneNumber!}'<#elseif attemptedPhoneNumberAsUsername??>'${login.username!}'<#else>''</#if>,
                    phoneActivated: <#if attemptedPhoneActivated??>true<#else>false</#if>,
                    sendButtonText: '${msg("sendVerificationCode")}',
                    initSendButtonText: '${msg("sendVerificationCode")}',
                    phoneNumberAsUsername: <#if attemptedPhoneNumberAsUsername??>true<#else>false</#if>,
                    email: <#if !attemptedPhoneNumberAsUsername??>'${login.username!}'<#else>''</#if>
                },
                methods: {
                  req(phoneNumber) {
                      const params = {params: {phoneNumber}};
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

                    console.log('fullPhoneNumber: ' + fullPhoneNumber);

                    // Validate phone number
                    if (!iti.isValidNumber()) {
                      this.errorMessage = 'Invalid phone number format.';
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
                },
                mounted() {
                    // Concatenate the phone number when the form is submitted
                    document.getElementById('kc-form-login').addEventListener('submit', this.onSubmit);
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
