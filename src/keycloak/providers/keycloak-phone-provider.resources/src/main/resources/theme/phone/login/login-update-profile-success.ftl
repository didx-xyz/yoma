<#import "template.ftl" as layout>
<@layout.registrationLayout; section>
    <#if section = "header">
        ${msg("accountUpdatedTitle")}
    <#elseif section = "form">
        <div class="instruction">
            ${msg("accountUpdatedMessage")}
        </div>
        <div class="form-buttons">
            <div class="form-button form-button-primary">
                <a href="${url.loginUrl}">${msg("backToLogin")}</a>
            </div>
        </div>
    </#if>
</@layout.registrationLayout>
