<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        ${kcSanitize(msg("errorTitle"))?no_esc}
    <#elseif section = "form">
        <div id="kc-error-message">
            <p class="instruction">${kcSanitize(message.summary)?no_esc}</p>
            <#if traceId??>
                <p class="instruction" id="traceId">${msg("traceIdSupportMessage", traceId)}</p>
            </#if>
            <#if skipLink??>
            <#else>
                <#if pageRedirectUri?has_content>
                    <p><a id="backToApplication" href="${pageRedirectUri}" style="display: block;">${kcSanitize(msg("backToApplication"))?no_esc}</a></p>
                <#elseif (client.baseUrl)?has_content>
                    <p><a id="backToApplication" href="${client.baseUrl?remove_ending("/")}/login/return" style="display: block;">${kcSanitize(msg("backToApplication"))?no_esc}</a></p>
                <#else>
                    <p><a id="backToApplication" href="/" style="display: block;">${kcSanitize(msg("backToApplication"))?no_esc}</a></p>
                </#if>
            </#if>
        </div>
    </#if>
</@layout.registrationLayout>
