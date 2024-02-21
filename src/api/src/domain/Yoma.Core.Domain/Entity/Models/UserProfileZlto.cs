using Yoma.Core.Domain.Reward;

namespace Yoma.Core.Domain.Entity.Models
{
    public class UserProfileZlto
    {
        public WalletCreationStatus WalletCreationStatus { get; set; }

        public decimal Available { get; set; }

        public decimal Pending { get; set; }

        public decimal Total { get; set; }

        public bool? ZltoOffline { get; set; }
    }
}
