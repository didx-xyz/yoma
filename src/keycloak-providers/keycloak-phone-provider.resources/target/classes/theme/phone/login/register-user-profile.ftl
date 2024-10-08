<#import "template.ftl" as layout>
 <@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm','phoneNumber','registerCode'); section>
<#--  <@layout.registrationLayout displayMessage=messagesPerField.exists('global') displayRequiredFields=false; section>  -->

    <#if section = "header">
        ${msg("registerTitle")}
    <#elseif section = "form">
        <#if phoneNumberRequired??>
            <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
        </#if>
        <div id="vue-app">
        <form id="kc-register-form" class="${properties.kcFormClass!}" action="${url.registrationAction}" method="post">
            <#if phoneNumberRequired??>
            <div class="alert-error ${properties.kcAlertClass!} pf-m-danger" v-show="errorMessage">
                <div class="pf-c-alert__icon">
                    <span class="${properties.kcFeedbackErrorIcon!}"></span>
                </div>

                <span class="${properties.kcAlertTitleClass!}">{{ errorMessage }}</span>
            </div>
            </#if>

            <#if !hideName??>
            <div class="${properties.kcFormGroupClass!}">
                <div class="${properties.kcLabelWrapperClass!}">
                    <label for="firstName" class="${properties.kcLabelClass!}">${msg("firstName")}</label> *
                </div>
                <div class="${properties.kcInputWrapperClass!}">
                    <input type="text" id="firstName" class="${properties.kcInputClass!}" name="firstName"
                           value="${(register.formData.firstName!'')}"
                           aria-invalid="<#if messagesPerField.existsError('firstName')>true</#if>"
                    />

                    <#if messagesPerField.existsError('firstName')>
                        <span id="input-error-firstname" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                            ${kcSanitize(messagesPerField.get('firstName'))?no_esc}
                        </span>
                    </#if>
                </div>
            </div>

            <div class="${properties.kcFormGroupClass!}">
                <div class="${properties.kcLabelWrapperClass!}">
                    <label for="lastName" class="${properties.kcLabelClass!}">${msg("lastName")}</label> *
                </div>
                <div class="${properties.kcInputWrapperClass!}">
                    <input type="text" id="lastName" class="${properties.kcInputClass!}" name="lastName"
                           value="${(register.formData.lastName!'')}"
                           aria-invalid="<#if messagesPerField.existsError('lastName')>true</#if>"
                    />

                    <#if messagesPerField.existsError('lastName')>
                        <span id="input-error-lastname" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                            ${kcSanitize(messagesPerField.get('lastName'))?no_esc}
                        </span>
                    </#if>
                </div>
            </div>
            </#if>

            <#if !hideEmail??>
            <div class="${properties.kcFormGroupClass!}">
                <div class="${properties.kcLabelWrapperClass!}">
                    <label for="email" class="${properties.kcLabelClass!}">${msg("email")}</label>
                </div>
                <div class="${properties.kcInputWrapperClass!}">
                    <input type="text" id="email" class="${properties.kcInputClass!}" name="email"
                           value="${(register.formData.email!'')}" autocomplete="email"
                           aria-invalid="<#if messagesPerField.existsError('email')>true</#if>"
                    />

                    <#if messagesPerField.existsError('email')>
                        <span id="input-error-email" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                            ${kcSanitize(messagesPerField.get('email'))?no_esc}
                        </span>
                    </#if>
                </div>
            </div>
            </#if>

            <#if !(realm.registrationEmailAsUsername || registrationPhoneNumberAsUsername??)>
                <div class="${properties.kcFormGroupClass!}">
                    <div class="${properties.kcLabelWrapperClass!}">
                        <label for="username" class="${properties.kcLabelClass!}">${msg("username")}</label>
                    </div>
                    <div class="${properties.kcInputWrapperClass!}">
                        <input type="text" id="username" class="${properties.kcInputClass!}" name="username"
                               value="${(register.formData.username!'')}" autocomplete="username"
                               aria-invalid="<#if messagesPerField.existsError('username')>true</#if>"
                        />

                        <#if messagesPerField.existsError('username')>
                            <span id="input-error-username" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                ${kcSanitize(messagesPerField.get('username'))?no_esc}
                            </span>
                        </#if>
                    </div>
                </div>
            </#if>

            <#if passwordRequired??>
              <div class="${properties.kcFormGroupClass!}">
              	<div class="${properties.kcLabelWrapperClass!}">
												<label for="password" class="${properties.kcLabelClass!}">
													${msg("password")}
												</label> *
                         <div id="password-instructions"> ${msg("passwordInstructions")}</div>
              	</div>
              	<div class="${properties.kcInputWrapperClass!}">
												<div class="password-container">
                          <i class="fa fa-eye-slash" id="toggle-password" onclick="togglePassword('#register-password', '#toggle-password')"></i>
													<input type="password" id="register-password" class="${properties.kcInputClass!}" name="password"
													autocomplete="new-password"
													aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>" />
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
													aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>" />

												</div>
												<#if messagesPerField.existsError('password-confirm')>
													<span id="input-error-password-confirm" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
														${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
													</span>
												</#if>
											</div>
              </div>
            </#if>

            <#if phoneNumberRequired??>
                <div class="${properties.kcFormGroupClass!} ${messagesPerField.printIfExists('phoneNumber',properties.kcFormGroupErrorClass!)}">
                    <div class="${properties.kcLabelWrapperClass!}">
                        <label for="phoneNumber" class="${properties.kcLabelClass!}">${msg("phoneNumber")}</label> *
                    </div>
                    <div class="${properties.kcInputWrapperClass!}">
                        <input id="phoneNumber" class="${properties.kcInputClass!}"
                               name="phoneNumber" id="phoneNumber" type="tel"
                               aria-invalid="<#if messagesPerField.existsError('phoneNumber')>true</#if>"
                               autofocus
                               value="${(register.formData.phoneNumber!'')}"
                               autocomplete="mobile tel"/>
                        <#if messagesPerField.existsError('phoneNumber')>
                            <span id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                ${kcSanitize(messagesPerField.get('phoneNumber'))?no_esc}
                            </span>
                        </#if>
                    </div>
                </div>

                <#if verifyPhone??>
                <div class=" ${properties.kcFormGroupClass!} row">

                    <div class="${properties.kcLabelWrapperClass!}" style="padding: 0">
                        <label for="registerCode" class="${properties.kcLabelClass!}">${msg("verificationCode")}</label> *
                    </div>
                   <div class="col-xs-8" style="padding: 0px 10px 10px 10px;">
                        <input id="code" name="code"
                               aria-invalid="<#if messagesPerField.existsError('registerCode')>true</#if>"
                               type="text" class="${properties.kcInputClass!}"
                               autocomplete="off"/>
                        <#if messagesPerField.existsError('registerCode')>
                            <span id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                                ${kcSanitize(messagesPerField.get('registerCode'))?no_esc}
                            </span>
                        </#if>
                    </div>
                   <div class="col-xs-4" style="margin-left: -20px; padding: 5px 0 0 0;">
                        <input style="height: 36px"
                               class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                               v-model="sendButtonText" :disabled='sendButtonText !== initSendButtonText'
                               v-on:click="sendVerificationCode()"
                               type="button" value="${msg("sendVerificationCode")}"/>
                    </div>


                </div>
                </#if>
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
            		<label for="terms" id="terms-label"><span id="terms-prefix">${msg("termsText1")}</span>
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
                <div id="kc-form-options" class="${properties.kcFormOptionsClass!}" style="padding-bottom: 5px;">
                    <div class="${properties.kcFormOptionsWrapperClass!}">
                        <span><a href="${url.loginUrl}">${kcSanitize(msg("backToLoginBtn"))?no_esc}</a></span>
                    </div>
                </div>

                <div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
                    <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("doRegisterBtn")}"/>
                </div>
            </div>
        </form>
        </div>

        <#if phoneNumberRequired??>

            <script type="text/javascript">
                function req(phoneNumber) {
                    const params = {params: {phoneNumber}}
                    axios.get(window.location.origin + '/realms/${realm.name}/sms/registration-code', params)
                        .then(res => app.disableSend(res.data.expires_in))
                        .catch(e => app.errorMessage = e.response.data.error);
                }

                const app = new Vue({
                    el: '#vue-app',
                    data: {
                        errorMessage: '',
                        phoneNumber: '',
                        sendButtonText: '${msg("sendVerificationCode")}',
                        initSendButtonText: '${msg("sendVerificationCode")}',
                        disableSend: function (seconds) {
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
                        sendVerificationCode: function () {
                            this.errorMessage = '';
                            const phoneNumber = document.getElementById('phoneNumber').value.trim();
                            if (!phoneNumber) {
                                this.errorMessage = '${msg("requiredPhoneNumber")}';
                                document.getElementById('phoneNumber').focus();
                                return;
                            }
                            if (this.sendButtonText !== this.initSendButtonText) return;
                            req(phoneNumber);
                        }
                    }
                });

            </script>
        </#if>

        <link rel="stylesheet" type="text/css" href="${url.resourcesPath}/css/passwordIndicator.css">
        <script src="${url.resourcesPath}/js/passwordIndicator.js"></script>
        <script>
          document.getElementById('email').addEventListener('input', function(e) {
            passwordIndicator("${url.resourcesPath}", '#email', '#register-password');
          });
          document.getElementById('register-password').addEventListener('input', function(e) {
            passwordIndicator("${url.resourcesPath}", '#email', '#register-password');
          });
        </script>
    </#if>
</@layout.registrationLayout>
