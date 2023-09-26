namespace Yoma.Core.Domain.SSI.Models.Provider
{
    public class SchemaRequest
    {
        public string Name { get; set; }

        public ICollection<string> Attributes { get; set; }
    }
}
