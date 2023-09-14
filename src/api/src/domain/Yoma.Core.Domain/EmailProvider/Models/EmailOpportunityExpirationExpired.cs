namespace Yoma.Core.Domain.EmailProvider.Models
{
    public class EmailOpportunityExpirationExpired : EmailBase
    {
        public string Title { get; set; }

        public DateTimeOffset DateStart { get; set; }

        public DateTimeOffset? DateEnd { get; set; }
    }
}
