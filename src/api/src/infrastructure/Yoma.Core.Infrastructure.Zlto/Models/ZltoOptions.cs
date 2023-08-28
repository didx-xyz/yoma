namespace Yoma.Core.Infrastructure.Zlto.Models
{
    public class ZltoOptions
    {
        public const string Section = "Zlto";

        public string BaseUrl { get; set; }

        public string AuthUrl { get; set; }

        public List<Account> Accounts { get; set; }
    }

    public class Account
    {
        public string CountryCodeAlpha2 { get; set; }

        public string ClientId { get; set; }

        public string ClientSecret { get; set; }

        public string Audience { get; set; }
    }
}
