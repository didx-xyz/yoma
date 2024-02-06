namespace Yoma.Core.Api.Common
{
    internal class Constants
    {
        internal const string RequestHeader_ApiKey = "X-ApiKey";
        internal const string Authorization_Policy = "yoma_core_api";
        internal const string Authorization_Policy_External_Partner = "yoma_core_api_external_partner";
        internal const string ClaimType_Scope = "scope";
        internal const string HttpContextItemsKey_Authenticated_OrganizationId = "Authenticated_OrganizationId";
        internal const string AuthenticationScheme_ClientCredentials = "ClientCredentials";
    }
}
