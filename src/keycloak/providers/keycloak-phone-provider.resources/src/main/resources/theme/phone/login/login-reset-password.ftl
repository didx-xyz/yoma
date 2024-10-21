<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=!messagesPerField.existsError('username','code','phoneNumber'); section>
    <#if section = "header">
        ${msg("emailForgotTitle")}
    <#elseif section = "form">

        <#if supportPhone??>
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
                <form id="kc-reset-password-form" class="${properties.kcFormClass!}" action="${url.loginAction}"
                      method="post">
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
                                <label for="username"
                                       class="${properties.kcLabelClass!}">${msg("email")}</label>
                            </div>
                            <div class="${properties.kcInputWrapperClass!}">
                                <input type="text" id="username" name="username" class="${properties.kcInputClass!}"
                                       autofocus
                                       value="${(auth.attemptedUsername!'')}"
                                       aria-invalid="<#if messagesPerField.existsError('username')>true</#if>"
                                       placeholder="${msg('enterEmail')}"/>
                                <#if messagesPerField.existsError('username')>
                                    <span id="input-error-username" class="${properties.kcInputErrorMessageClass!}"
                                          aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('username'))?no_esc}
                        </span>
                                </#if>
                            </div>
                        </div>
                    </div>

                    <#if supportPhone??>
                        <div v-if="phoneActivated">
                            <div class="${properties.kcFormGroupClass!}">
                                <select id="phoneNumberCountryCode" name="phoneNumberCountryCode" class="${properties.kcInputClass!}" v-model="phoneNumberCountryCode">
                                    <option value="+27">South Africa (+27)</option>
                                </select>
                                <input id="phoneNumberPartial" class="${properties.kcInputClass!}" name="phoneNumberPartial" type="tel" placeholder="${msg('enterPhoneNumber')}"
                                    aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>" v-model="phoneNumber" autocomplete="mobile tel" />
                                <#if messagesPerField.existsError('phoneNumber')>
                                    <span id="input-error" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                        ${kcSanitize(messagesPerField.getFirstError('phoneNumber'))?no_esc}
                                    </span>
                                </#if>
                            </div>
                            <#--  <div class="${properties.kcFormGroupClass!}">
                                <div class="${properties.kcLabelWrapperClass!}">

                                <label for="phoneNumber"
                                       class="${properties.kcLabelClass!}">${msg("phoneNumber")}</label>
                                </div>
                                <div class="${properties.kcInputWrapperClass!}">
                                <input type="text" id="phoneNumber" name="phoneNumber" v-model="phoneNumber"
                                       aria-invalid="<#if messagesPerField.existsError('code','phoneNumber')>true</#if>"
                                       class="${properties.kcInputClass!}" autofocus/>

                                <#if messagesPerField.existsError('code','phoneNumber')>
                                    <span id="input-error" class="${properties.kcInputErrorMessageClass!}"
                                          aria-live="polite">
                                    ${kcSanitize(messagesPerField.getFirstError('phoneNumber','code'))?no_esc}
                                    </span>
                                </#if>
                                </div>
                            </div>  -->

                            <div class="${properties.kcFormGroupClass!} row">
                                <div class="${properties.kcLabelWrapperClass!}" style="padding: 0">
                                    <label for="code"
                                           class="${properties.kcLabelClass!}">${msg("verificationCode")}</label>
                                </div>
                                <div class="col-xs-8" style="padding: 0px 10px 10px 10px;">
                                    <input type="text" id="code" name="code"
                                           aria-invalid="<#if messagesPerField.existsError('code','phoneNumber')>true</#if>"
                                           class="${properties.kcInputClass!}" autocomplete="off"
                                           placeholder="${msg('enterCode')}" />
                                </div>
                                 <div class="col-xs-4" style="margin-left: -20px; padding: 5px 0 0 0;">
                                    <input tabindex="0" style="height: 36px"
                                           class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                                           type="button" v-model="sendButtonText"
                                           :disabled='sendButtonText !== initSendButtonText'
                                           v-on:click="sendVerificationCode()"/>
                                </div>
                            </div>

                        </div>
                    </#if>

                    <div class="${properties.kcFormGroupClass!} ${properties.kcFormSettingClass!}">
                        <div id="kc-form-options" class="${properties.kcFormOptionsClass!}" style="padding-bottom: 5px;">
                            <div class="${properties.kcFormOptionsWrapperClass!}">
                                <span><a href="${url.loginUrl}">${kcSanitize(msg("backToLogin"))?no_esc}</a></span>
                            </div>
                        </div>

                        <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                            <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                                   type="submit" value="${msg("doSubmit")}"/>
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
                  const params = {params: {phoneNumber}
                };
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
                const phoneNumberPartial = document.getElementById('phoneNumberPartial').value.trim();
                const phoneNumberCountryCode = document.getElementById('phoneNumberCountryCode').value;
                const fullPhoneNumber = phoneNumberCountryCode + phoneNumberPartial;
                document.getElementById('phoneNumber').value = fullPhoneNumber;
              },
              setCountryCode() {

              },
            },
            mounted() {
              this.setCountryCode();
              document.getElementById('kc-register-form').addEventListener('submit', this.concatenatePhoneNumber);
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
