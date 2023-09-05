namespace Yoma.Core.Domain.RewardsProvider.Models
{
    public class Wallet
    {
        public string Id { get; set; }

        public Guid OwnerId { get; set; }

        public DateTimeOffset DateCreated { get; set; }

        public DateTimeOffset DateModified { get; set; }
    }
}
