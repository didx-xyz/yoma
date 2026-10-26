using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Test.SSI.Fixtures
{
  internal static partial class SchemaFixtureData
  {
    private static SSISchemaEntity Organization() =>
    new()
    {
      Id = new Guid("b8c64b98-61c2-43f8-a583-7a7927340333"),
      Name = "Organization",
      TypeName = "Yoma.Core.Domain.Entity.Models.Organization",
      Properties = [
        new()
        {
          Id = new Guid("f815a540-8c83-41de-b67c-f327a4b92af0"),
          Name = "Name",
          NameDisplay = "Name",
          Description = "Yoma (Youth Agency Marketplace)",
          System = true,
          SystemType = SchemaEntityPropertySystemType.Issuer,
          Required = true
        },
        new()
        {
          Id = new Guid("084b3027-af8a-4329-8221-c6437cfbcd61"),
          Name = "LogoURL",
          NameDisplay = "Logo URL",
          Description = "Yoma (Youth Agency Marketplace) Logo Url",
          System = true,
          SystemType = SchemaEntityPropertySystemType.IssuerLogoURL,
          Required = false
        }
      ],
      Types = [
        new()
        {
          Id = new Guid("ec978798-aac0-4577-846e-1b5b2e6663ce"),
          Type = SchemaType.YoID,
          Name = "YoID",
          SupportMultiple = false
        }
      ]
    };
  }
}
