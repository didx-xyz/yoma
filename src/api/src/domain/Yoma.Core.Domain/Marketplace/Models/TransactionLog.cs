namespace Yoma.Core.Domain.Marketplace.Models
{
    public class TransactionLog
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public string ItemId { get; set; }

        public Guid StatusId { get; set; }

        public TransactionStatus Status { get; set; }

        public decimal Amount { get; set; }

        public string TransactionId { get; set; }

        public DateTimeOffset DateCreated { get; set; }

        public DateTimeOffset DateModified { get; set; }
    }
}
