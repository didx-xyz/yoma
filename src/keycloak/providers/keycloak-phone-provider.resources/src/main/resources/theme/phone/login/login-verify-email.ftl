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
            <br/>
            <br/>
             ${msg("emailVerifyInstruction5")}
            <a href="mailto:help@yoma.world" class="form-link">${msg("doClickHere")}</a> ${msg("emailVerifyInstruction6")}
        </p>
    </#if>
</@layout.registrationLayout>
