namespace Yoma.Core.Domain.Analytics.Models
{
    public class OrganizationDemographic
    {
        public List<Tuple<string, int>> Countries { get; set; }

        public List<Tuple<string, int>> Genders { get; set; }

        public List<Tuple<string, int>> Ages { get; set; }
    }
}
