namespace Yoma.Core.Domain.RewardsProvider.Models
{
    public class Transaction
    {
        public int Id { get; set; }

        public string Description { get; set; }

        public decimal Amount { get; set; }

        public DateTimeOffset DateCreated { get; set; }

        public DateTimeOffset DateModified { get; set; }
    }
}
