namespace Yoma.Core.Domain.Marketplace.Models
{
    public class StoreItemCategory
    {
        public int Id { get; set; }

        public string StoreId { get; set; }

        public string Name { get; set; }

        public string Description { get; set; }

        public string Summary { get; set; }

        public string ImageURL { get; set; }

        public int ItemCount { get; set; }

        public decimal Amount { get; set; }
    }
}
