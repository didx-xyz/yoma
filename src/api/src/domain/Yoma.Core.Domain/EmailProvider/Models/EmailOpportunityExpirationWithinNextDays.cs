namespace Yoma.Core.Domain.EmailProvider.Models
{
    public class EmailOpportunityExpirationWithinNextDays : EmailBase
    {
        public string Title { get; set; }

        public DateTimeOffset DateStart { get; set; }

        public DateTimeOffset? DateEnd { get; set; }
    }
}
