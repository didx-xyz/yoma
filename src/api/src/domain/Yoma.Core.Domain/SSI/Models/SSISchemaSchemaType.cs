namespace Yoma.Core.Domain.SSI.Models
{
    public class SSISchemaSchemaType
    {
        public Guid Id { get; set; }

        public Guid SSISchemaTypeId { get; set; }

        public string SSISSchemaTypeName { get; set; }

        public string SSISchemaTypeDescription { get; set; }

        public string? SSISchemaName { get; set; }

        public DateTimeOffset DateCreated { get; set; }
    }
}
