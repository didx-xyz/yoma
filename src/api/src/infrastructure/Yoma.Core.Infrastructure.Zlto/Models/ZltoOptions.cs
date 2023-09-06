namespace Yoma.Core.Infrastructure.Zlto.Models
{
    public class ZltoOptions
    {
        public const string Section = "Zlto";

        public string Username { get; set; }

        public string Password { get; set; }

        public Partner Partner { get; set; }

        public Wallet Wallet { get; set; }

        public Store Store { get; set; }
    }

    public class Partner
    {
        public string BaseUrl { get; set; }
    }

    public class Wallet
    {
        public string BaseUrl { get; set; }
    }

    public class Store
    {
        public string BaseUrl { get; set; }
    }
}
