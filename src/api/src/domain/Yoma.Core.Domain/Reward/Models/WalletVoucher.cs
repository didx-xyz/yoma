namespace Yoma.Core.Domain.Reward.Models
{
    public class WalletVoucher
    {
        public string Id { get; set; }

        public string Category { get; set; }

        public string Name { get; set; }

        public string Code { get; set; }

        public string Instructions { get; set; }

        public decimal Amount { get; set; }

        public VoucherStatus Status { get; set; }
    }
}
