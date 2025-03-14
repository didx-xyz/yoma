<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        <#if messageHeader??>
            ${kcSanitize(msg("${messageHeader}"))?no_esc}
        <#else>
        ${message.summary}
        </#if>
    <#elseif section = "form">
    <div id="kc-info-message">
        <p class="instruction">${message.summary}<#if requiredActions??><#list requiredActions>: <b><#items as reqActionItem>${kcSanitize(msg("requiredAction.${reqActionItem}"))?no_esc}<#sep>, </#items></b></#list><#else></#if></p>
        <#--  <#if skipLink??>
        <#else>  -->
            <#if pageRedirectUri?has_content>
                <p><a href="${pageRedirectUri}" style="display: block;">${kcSanitize(msg("backToApplication"))?no_esc}</a></p>
            <#elseif actionUri?has_content>
                <p><a href="${actionUri}" style="display: block;">${kcSanitize(msg("proceedWithAction"))?no_esc}</a></p>
            <#elseif (client.baseUrl)?has_content>
                <p><a href="${client.baseUrl}" style="display: block;">${kcSanitize(msg("backToApplication"))?no_esc}</a></p>
            <#else>
                <p><a href="/" style="display: block;">${kcSanitize(msg("backToApplication"))?no_esc}</a></p>
            </#if>
        <#--  </#if>  -->
    </div>
    </#if>
</@layout.registrationLayout>
