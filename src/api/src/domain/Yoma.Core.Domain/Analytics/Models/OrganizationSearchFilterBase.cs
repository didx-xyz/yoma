using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Analytics.Models
{
    public abstract class OrganizationSearchFilterBase : PaginationFilter
    {
        public Guid Organization { get; set; }

        public List<Guid>? Opportunities { get; set; }

        public List<Guid>? Categories { get; set; }

        public DateTimeOffset StartDate { get; set; }

        public DateTimeOffset EndDate { get; set; }
    }
}
