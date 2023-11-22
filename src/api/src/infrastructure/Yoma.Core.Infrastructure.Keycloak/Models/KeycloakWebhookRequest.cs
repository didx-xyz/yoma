namespace Yoma.Core.Domain.Keycloak.Models
{
    public class KeycloakWebhookRequest
    {
        public string type { get; set; }
        public string realmId { get; set; }
        public string id { get; set; }
        public long time { get; set; }
        public string clientId { get; set; }
        public string userId { get; set; }
        public string ipAddress { get; set; }
        public Details details { get; set; }
    }

    public class Details
    {
        public string auth_method { get; set; }
        public string auth_type { get; set; }
        public string redirect_uri { get; set; }
        public string code_id { get; set; }
        public string username { get; set; }
    }
}
