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
                  <i class="fa fa-eye-slash" id="toggle-password" onclick="togglePassword()"></i>
                  <input type="password" id="register-password" class="${properties.kcInputClass!}" name="password"
                  autocomplete="new-password"
                  aria-invalid="<#if messagesPerField.existsError('password','register-password-confirm')>true</#if>" />
                </div>
                <div id="password-requirements">
                  <div id="label">Password requirements:</div>
                  <p id="length">10 characters</p>
                  <p id="lowercase">1 lower case</p>
                  <p id="uppercase">1 upper case</p>
                  <p id="number">1 number</p>
                  <p id="email">Not email</p>
                </div>
                <#if messagesPerField.existsError('password')>
                  <span id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                </#if>
              </div>
            </div>
          </#if>
        </#if>
      </@>
    </form>
    <link rel="stylesheet" type="text/css" href="${url.resourcesPath}/css/passwordIndicator.css">
    <script src="${url.resourcesPath}/js/passwordIndicator.js"></script>
    <script>
      document.getElementById('register-password').addEventListener('input', function(e) {
        var password = e.target.value;
        passwordIndicator("${url.resourcesPath}", '#email', password);
      });
    </script>
  </#if>
</@>
