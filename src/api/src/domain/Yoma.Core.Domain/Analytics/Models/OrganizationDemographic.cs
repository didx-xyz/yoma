namespace Yoma.Core.Domain.Analytics.Models
{
    public class OrganizationDemographic
    {
        public Demographic Countries { get; set; }

        public Demographic Genders { get; set; }

        public Demographic Ages { get; set; }
    }

    public class Demographic
    {
        public string Legend { get; set; }

        public Dictionary<string, int> Items { get; set; }
    }
}
