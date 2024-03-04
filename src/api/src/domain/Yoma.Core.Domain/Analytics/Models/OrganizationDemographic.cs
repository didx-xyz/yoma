namespace Yoma.Core.Domain.Analytics.Models
{
    public class OrganizationDemographic
    {
        public Dictionary<string, int> Countries { get; set; }

        public Dictionary<string, int> Genders { get; set; }

        public Dictionary<string, int> Ages { get; set; }
    }
}
