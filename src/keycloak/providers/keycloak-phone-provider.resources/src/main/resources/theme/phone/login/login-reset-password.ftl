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
                                        <li role="presentation" v-bind:class="{ active: !phoneActivated }"
                                            v-on:click="phoneActivated = false"><a
                                                    href="#">${msg("email")}</a>
                                        </li>
                                        <li role="presentation" v-bind:class="{ active: phoneActivated }"
                                            v-on:click="phoneActivated = true"><a href="#">${msg("phoneNumber")}</a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <input type="hidden" id="phoneActivated" name="phoneActivated" v-model="phoneActivated">
                    </#if>

                    <div <#if supportPhone??> v-if="!phoneActivated" </#if> >
                        <div class="${properties.kcFormGroupClass!}">
                            <div class="${properties.kcLabelWrapperClass!}">
                                <label for="username" class="${properties.kcLabelClass!}">${msg("email")}</label>
                            </div>
                            <div class="${properties.kcInputWrapperClass!}">
                                <input type="text" id="username" name="username" class="${properties.kcInputClass!}"
                                       autofocus
                                       value="${(auth.attemptedUsername!'')}"
                                       aria-invalid="<#if messagesPerField.existsError('username')>true</#if>"
                                       placeholder="${msg('enterEmail')}"/>
                                <#if messagesPerField.existsError('username')>
                                    <span id="input-error-username" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                      ${kcSanitize(messagesPerField.get('username'))?no_esc}
                                    </span>
                                </#if>
                            </div>
                        </div>
                    </div>

                    <#if supportPhone??>
                      <div v-if="phoneActivated">
                        <div class="${properties.kcFormGroupClass!}">
                          <div class="${properties.kcLabelWrapperClass!}">
                            <label for="phoneNumberPicker" class="${properties.kcLabelClass!}">${msg("phoneNumber")}</label>
                          </div>
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

                        <div class="${properties.kcFormGroupClass!}">
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
                      </div>
                    </#if>

                    <div class="${properties.kcFormGroupClass!} ${properties.kcFormSettingClass!}">
                        <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                            <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                                   type="submit" value="${msg('doSubmit')}"/>
                        </div>

                        <div id="kc-form-options" class="${properties.kcFormOptionsClass!}" style="padding-top: 15px;">
                            <div class="${properties.kcFormOptionsWrapperClass!}">
                                <span><a href="${url.loginUrl}">${kcSanitize(msg("backToLogin"))?no_esc}</a></span>
                            </div>
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
                initSendButtonText: '${msg("sendVerificationCode")}'
              },
              methods: {
                req(phoneNumber) {
                    const params = {params: {phoneNumber}};
                    axios.get(window.location.origin + '/realms/${realm.name}/sms/reset-code', params)
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
                document.getElementById('kc-reset-password-form').addEventListener('submit', this.onSubmit);
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
