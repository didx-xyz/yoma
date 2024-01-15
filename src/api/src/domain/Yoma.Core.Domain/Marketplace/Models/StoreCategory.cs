namespace Yoma.Core.Domain.Marketplace.Models
{
    public class StoreCategory
    {
        public string Id { get; set; }

        public string Name { get; set; }

        public List<string> StoreImageURLs { get; set; }
    }
}
