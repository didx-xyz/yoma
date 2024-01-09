namespace Yoma.Core.Domain.RewardsProvider.Models
{
    public class WalletVoucher
    {
        public string Id { get; set; }

        public string Category { get; set; }

        public string Name { get; set; }

        public string Code { get; set; }

        public string Instructions { get; set; }

        public int ZltoAmount { get; set; }

        //TODO: type
    }
}
