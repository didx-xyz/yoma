namespace Yoma.Core.Domain.EmailProvider.Models
{
    public class EmailOpportunityVerificationRejected : EmailBase
    {
        public string Title { get; set; }

        public string? Comment { get; set; }
    }
}
