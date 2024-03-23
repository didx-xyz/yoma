<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true; section>
    <#if section = "header">
        ${msg("emailVerifyTitle")}
        <div>
         <img id="email-icon" src="${url.resourcesPath}/img/email-icon.png" alt="email-icon"/>
        </div>
    <#elseif section = "form">
        <p id="email-verify-text" class="instruction">${msg("emailVerifyInstruction1",user.email)}</p>
        <h3 id="user-email">${user.email}</h3>
    <#elseif section = "info">
    <div class="verify-instructions">
        <p id="instruction">
            ${msg("emailVerifyInstruction2")}
        </p>
        <p id="instruction">${msg("emailVerifyInstruction3")}</p>
        <p id="instruction">
         Link expires in ${msg("emailVerifyLinkExpirationTime", linkExpirationFormatter(linkExpiration))}
        </p>
    </div>
         <a id="email-verify-link" href="${url.loginAction}">${msg("resendEmailVerificationBtn")}</a>
    </#if>
</@layout.registrationLayout>
