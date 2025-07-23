<#import "template.ftl" as layout>
<@layout.emailLayout>
${kcSanitize(msg("linkIdpBodyHtml", identityProviderDisplayName, link, linkExpirationFormatter(linkExpiration)))?no_esc}
</@layout.emailLayout>
