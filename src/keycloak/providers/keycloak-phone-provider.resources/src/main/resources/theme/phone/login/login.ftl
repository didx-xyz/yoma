<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password','code','phoneNumber') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        ${msg("loginAccountTitle")}
    <#elseif section = "form">
        <#if !usernameHidden?? && supportPhone??>
          <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
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
                              <label for="username" class="${properties.kcLabelClass!}">
                                  <#if !realm.loginWithEmailAllowed>
                                      ${msg("username")}
                                      <#if loginWithPhoneNumber??> ${msg("usernameOrPhoneNumber")} <#else>${msg("username")}</#if>
                                  <#elseif !realm.registrationEmailAsUsername>
                                      <#if loginWithPhoneNumber??> ${msg("emailOrPhoneNumber")} <#else>${msg("usernameOrEmail")}</#if>
                                  <#else>
                                      <#if loginWithPhoneNumber??> ${msg("emailOrPhoneNumber")} <#else>${msg("email")}</#if>
                                  </#if>
                              </label>

                              <input tabindex="0" id="username" class="${properties.kcInputClass!}" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="off"
                                    aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>" />

                              <#if messagesPerField.existsError('username','password')>
                                  <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                      ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                                  </span>
                              </#if>
                          </div>
                      </#if>

                      <div class="${properties.kcFormGroupClass!}">
                          <label for="password" class="${properties.kcLabelClass!}">${msg("password")}</label>
                          <input tabindex="0" id="password" class="${properties.kcInputClass!}" name="password" type="password" autocomplete="off"
                                aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>" />

                          <#if usernameHidden?? && messagesPerField.existsError('username','password')>
                              <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                  ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                              </span>
                          </#if>
                      </div>

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
                  </div>

                  <#if !usernameHidden?? && supportPhone??>
                      <div v-if="phoneActivated">
                          <div class="${properties.kcFormGroupClass!}">
                              <label for="phoneNumberPartial" class="${properties.kcLabelClass!}">${msg("phoneNumber")}</label>
                              <select id="phoneNumberCountryCode" name="phoneNumberCountryCode" class="${properties.kcInputClass!}" v-model="phoneNumberCountryCode">
                                  <option value="+27">South Africa (+27)</option>
                              </select>
                              <input id="phoneNumberPartial" class="${properties.kcInputClass!}" name="phoneNumberPartial" type="tel" placeholder="Enter phone number"
                                    aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" v-model="phoneNumber" autocomplete="mobile tel" />

                              <#if messagesPerField.existsError('phoneNumber')>
                                  <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                      ${kcSanitize(messagesPerField.getFirstError('phoneNumber'))?no_esc}
                                  </span>
                              </#if>

                              <!-- Hidden input for concatenated phone number -->
                              <input type="hidden" id="phoneNumber" name="phoneNumber" />
                          </div>

                          <div class="${properties.kcFormGroupClass!} row">
                              <div class="${properties.kcLabelWrapperClass!}" style="padding: 0">
                                  <label for="code" class="${properties.kcLabelClass!}">${msg("verificationCode")}</label>
                              </div>
                              <div>
                                  <div class="col-xs-8" style="padding: 0px 10px 10px 10px;">
                                      <input tabindex="0" type="text" id="code" name="code" aria-invalid="<#if messagesPerField.existsError('code')>true</#if>"
                                            class="${properties.kcInputClass!}" autocomplete="off" />
                                  </div>
                                  <div class="col-xs-4" style="margin-left: -20px; padding: 5px 0 0 0;">
                                      <input tabindex="0" style="height: 36px" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                                            type="button" v-model="sendButtonText" :disabled='sendButtonText !== initSendButtonText' v-on:click="sendVerificationCode()" />
                                  </div>
                              </div>

                              <#if messagesPerField.existsError('code')>
                                  <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                      ${kcSanitize(messagesPerField.getFirstError('code'))?no_esc}
                                  </span>
                              </#if>
                          </div>
                      </div>
                  </#if>

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
              var app = new Vue({
                  el: '#vue-app',
                  data: {
                      errorMessage: '',
                      phoneNumber: '${attemptedPhoneNumber!}',
                      phoneNumberCountryCode: '${attemptedPhoneNumberCountryCode!}',
                      phoneActivated: <#if attemptedPhoneActivated??>true<#else>false</#if>,
                      sendButtonText: '${msg("sendVerificationCode")}',
                      initSendButtonText: '${msg("sendVerificationCode")}'
                  },
                  methods: {
                    req(phoneNumber) {
                        const params = {params: {phoneNumber}
                      };
                      axios.get(window.location.origin + '/realms/${realm.name}/sms/registration-code', params)
                      .then(res => this.disableSend(res.data.expires_in))
                      .catch(e => this.errorMessage = e.response.data.error);
                    },
                    disableSend: function(seconds) {
                        if (seconds <= 0) {
                            app.sendButtonText = app.initSendButtonText;
                        } else {
                            const minutes = Math.floor(seconds / 60) + '';
                            const seconds_ = seconds % 60 + '';
                            app.sendButtonText = String(minutes.padStart(2, '0') + ":" + seconds_.padStart(2, '0'));
                            setTimeout(function () {
                                app.disableSend(seconds - 1);
                            }, 1000);
                        }
                    },
                    sendVerificationCode() {
                      this.errorMessage = '';
                      const phoneNumberPartial = document.getElementById('phoneNumberPartial').value.trim();
                      const phoneNumberCountryCode = document.getElementById('phoneNumberCountryCode').value;
                      const fullPhoneNumber = phoneNumberCountryCode + phoneNumberPartial;

                      // Validate phone number
                      const phoneRegex = /^\+?\d+$/;
                      if (!phoneRegex.test(phoneNumberPartial)) {
                        this.errorMessage = 'Invalid phone number format.';
                        return;
                      }

                      if (this.sendButtonText !== this.initSendButtonText) return;
                      this.req(fullPhoneNumber);
                    },
                    concatenatePhoneNumber() {
                        console.warn('Concatenating phone number');
                        const phoneNumberPartial = document.getElementById('phoneNumberPartial').value.trim();
                        const phoneNumberCountryCode = document.getElementById('phoneNumberCountryCode').value;
                        const fullPhoneNumber = phoneNumberCountryCode + phoneNumberPartial;

                        console.warn('fullPhoneNumber', fullPhoneNumber);

                        // Set the hidden field value for the full phone number
                        document.getElementById('phoneNumber').value = fullPhoneNumber;
                    },
                    setCountryCode() {

                    },
                  },
                  mounted() {
                      this.setCountryCode();

                      // Concatenate the phone number when the form is submitted
                      document.getElementById('kc-form-login').addEventListener('submit', this.concatenatePhoneNumber);
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
