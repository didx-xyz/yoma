namespace Yoma.Core.Domain.EmailProvider.Models
{
    public class EmailOpportunityVerificationCompleted : EmailBase
    {
        public string Title { get; set; }

        public string? Comment { get; set; }

        public DateTimeOffset DateCompleted { get; set; }
    }
}
