<#import "template.ftl" as layout>
<@layout.registrationLayout; section>
    <#if section = "header">
        ${msg("pageExpiredTitle")}
    <#elseif section = "form">
        <div id="page-expired-container">
            <p id="instruction">${msg("pageExpiredMsg1")}</p>
            <a id="back-to-login" href="${url.loginRestartFlowUrl}">${msg("backToLogin")}</a>
        </div>
    </#if>
</@layout.registrationLayout>
