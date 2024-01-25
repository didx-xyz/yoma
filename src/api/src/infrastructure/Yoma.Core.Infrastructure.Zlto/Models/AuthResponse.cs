namespace Yoma.Core.Infrastructure.Zlto.Models
{
    public class AuthResponse
    {
        public string AccessToken { get; set; }

        public string PartnerName { get; set; }

        public string PartnerId { get; set; }

        public DateTimeOffset Date { get; } = DateTimeOffset.UtcNow;

        public DateTimeOffset DateExpire { get; set; }
    }
}
