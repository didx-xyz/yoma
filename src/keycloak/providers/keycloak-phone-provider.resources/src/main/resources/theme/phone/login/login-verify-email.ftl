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
            <a href="${url.loginAction}" style="font-style: italic; font-weight: bold">${msg("doClickHere")}</a> ${msg("emailVerifyInstruction4")}
            <br/>
            <br/>
             ${msg("emailVerifyInstruction5")}
            <a href="mailto:help@yoma.world" style="font-style: italic; font-weight: bold">${msg("doClickHere")}</a> ${msg("emailVerifyInstruction6")}
			<br/>
            <br/>
            <#if pageRedirectUri?has_content>
                <p><a id="backToApplication" href="${pageRedirectUri}" style="display: block;">${kcSanitize(msg("backToApplication"))?no_esc}</a></p>
            <#elseif (client.baseUrl)?has_content>
                <p><a id="backToApplication" href="${client.baseUrl?remove_ending("/")}/auth/return" style="display: block;">${kcSanitize(msg("backToApplication"))?no_esc}</a></p>
            <#else>
                <p><a id="backToApplication" href="/" style="display: block;">${kcSanitize(msg("backToApplication"))?no_esc}</a></p>
            </#if>
		</p>
    </#if>
</@layout.registrationLayout>
