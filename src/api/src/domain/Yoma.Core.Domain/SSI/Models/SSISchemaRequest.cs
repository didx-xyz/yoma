namespace Yoma.Core.Domain.SSI.Models.Lookups
{
    public class SSISchemaRequest
    {
        public string Name { get; set; }

        public List<SSISchemaRequestEntity> Entities { get; set; }
    }
}
