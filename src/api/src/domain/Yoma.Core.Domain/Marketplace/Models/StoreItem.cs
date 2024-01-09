namespace Yoma.Core.Domain.Marketplace.Models
{
    public class StoreItem
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public string Description { get; set; }

        public string Summary { get; set; }

        public string Code { get; set; }

        public string ImageURL { get; set; }

        public int ZltoAmount { get; set; }
    }
}
