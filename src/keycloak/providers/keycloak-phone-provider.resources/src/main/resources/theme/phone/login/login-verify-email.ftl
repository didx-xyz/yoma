<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true; section>
    <#if section = "header">
        ${msg("emailVerifyTitle")}
    <#elseif section = "form">
        <p class="instruction">${msg("emailVerifyInstruction1",user.email)}</p>
    <#elseif section = "info">
        <p class="instruction">
            ${msg("emailVerifyInstruction2")}
            <br/>
            <br/>
            ${msg("emailVerifyInstruction3")}
            <a href="${url.loginAction}" class="form-link">${msg("doClickHere")}</a> ${msg("emailVerifyInstruction4")}
        </p>
    </#if>
</@layout.registrationLayout>
