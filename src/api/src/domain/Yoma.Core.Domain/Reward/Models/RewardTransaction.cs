namespace Yoma.Core.Domain.Reward.Models
{
    public class RewardTransaction
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public Guid StatusId { get; set; }

        public RewardTransactionStatus Status { get; set; }

        public string SourceEntityType { get; set; }

        public Guid? MyOpportunityId { get; set; }

        public decimal Amount { get; set; }

        public string? TransactionId { get; set; }

        public string? ErrorReason { get; set; }

        public byte? RetryCount { get; set; }

        public DateTimeOffset DateCreated { get; set; }

        public DateTimeOffset DateModified { get; set; }
    }
}
