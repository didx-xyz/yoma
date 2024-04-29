<#import "template.ftl" as layout>
	<#import "user-profile-commons.ftl" as userProfileCommons>
		<@layout.registrationLayout displayMessage=messagesPerField.exists('global') displayRequiredFields=false; section>
			<#if section="header">
				${msg("registerTitle")}
				<#elseif section="form">
					<div class="centered-subTitles">
						<label>
							${msg("registerSubTitle")}
						</label>
					</div>
					<form id="kc-register-form" class="${properties.kcFormClass!}" action="${url.registrationAction}" method="post">
						<@userProfileCommons.userProfileFormFields; callback, attribute>
							<#if callback="afterField">
								<#-- render password fields just under the username or email (if used as username) -->
									<#if passwordRequired?? && (attribute.name=='username' || (attribute.name=='email' && realm.registrationEmailAsUsername))>
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
                          <p id="length">10 characters</p>
                          <p id="lowercase">1 lower case</p>
                          <p id="uppercase">1 upper case</p>
                          <p id="number">1 number</p>
                          <p id="email">Not email</p>
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
							</#if>
							</@userProfileCommons.userProfileFormFields>
							<!-- other inputs -->
							<div class="centered-div">
								<div class="centered-checkbox">
									<input
										type="checkbox"
										id="terms"
										name="user.attributes.terms_and_conditions"
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
							<div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
								<input id="register-btn" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" type="submit" value="${msg("doRegisterBtn")}" />
							</div>
							<div class="${properties.kcFormGroupClass!}">
								<div id="kc-form-options" class="${properties.kcFormOptionsClass!}">
									<div style="display: inline;" class="${properties.kcFormOptionsWrapperClass!}">
										<hr class="grey-hr">
										<div id="kc-form-buttons" class="${properties.kcFormButtonsClass!}">
											<a href="${url.loginUrl}" style="text-decoration: none;">
												<input id="back-to-login-btn" class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}" value="${msg("backToLoginBtn")} ${kcSanitize(msg(""))?no_esc}" />
											</a>
										</div>
										<!-- <span>
											<a href="${url.loginUrl}">
												${msg("verifiedAccount")}
												${kcSanitize(msg("backToLogin"))?no_esc}
											</a></span> -->
									</div>
								</div>
							</div>
					</form>

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
