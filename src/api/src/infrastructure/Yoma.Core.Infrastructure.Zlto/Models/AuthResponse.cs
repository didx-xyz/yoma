namespace Yoma.Core.Infrastructure.Zlto.Models
{
    public class AuthResponse
    {
        public string AccessToken { get; set; }

        public string PartnerName { get; set; }

        public string PartnerId { get; set; }

        public DateTimeOffset Date { get; } = DateTimeOffset.Now;

        public DateTimeOffset DateExpire
        {
            get { return Date.AddHours(24); } //valid for 30 hours; re-request after 24 hours
        }
    }
}
