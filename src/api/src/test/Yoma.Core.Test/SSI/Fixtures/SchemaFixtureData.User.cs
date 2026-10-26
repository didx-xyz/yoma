using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Test.SSI.Fixtures
{
  internal static partial class SchemaFixtureData
  {
    private static SSISchemaEntity User() =>
    new()
    {
      Id = new Guid("ac5c06ac-6ead-4b47-8e11-4b182daac8cc"),
      Name = "User",
      TypeName = "Yoma.Core.Domain.Entity.Models.User",
      Properties = [
        new()
        {
          Id = new Guid("32447353-1698-467c-8b5d-ad85e89235b0"),
          Name = "Email",
          NameDisplay = "Email",
          Description = "Email",
          Group = "Identity",
          SortOrder = 8,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("d26b85e6-223e-48b6-a12f-6c2d0136dd2f"),
          Name = "FirstName",
          NameDisplay = "First Name",
          Description = "First Name",
          Group = "Identity",
          SortOrder = 1,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("f7d89c98-0447-42df-8a2d-a369b9fbaeba"),
          Name = "Surname",
          NameDisplay = "Surname",
          Description = "Surname",
          Group = "Identity",
          SortOrder = 2,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("26ea32e2-5913-44b7-835f-12f0882685c4"),
          Name = "DisplayName",
          NameDisplay = "Display Name",
          Description = "Display Name",
          System = true,
          SystemType = SchemaEntityPropertySystemType.Title,
          Required = true
        },
        new()
        {
          Id = new Guid("64d4cbeb-3692-4e39-aaa7-b704f46afb6d"),
          Name = "PhoneNumber",
          NameDisplay = "Phone Number",
          Description = "Phone Number",
          Group = "Identity",
          SortOrder = 9,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("b14c9c34-4c89-4dae-88ab-9d667be2ef7f"),
          Name = "Country",
          NameDisplay = "Country",
          Description = "Country",
          Group = "Identity",
          SortOrder = 4,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("b88a8825-fc5a-4000-93fe-9406a7898c58"),
          Name = "Education",
          NameDisplay = "Education",
          Description = "Education",
          Group = "Identity",
          SortOrder = 6,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("c26d9276-5f94-4bb3-94ba-67c435025708"),
          Name = "Gender",
          NameDisplay = "Gender",
          Description = "Gender",
          Group = "Identity",
          SortOrder = 5,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("d56808d2-f3db-4d82-aa5c-1fba04c8e3bd"),
          Name = "DateOfBirth",
          NameDisplay = "Date Of Birth",
          Description = "Date of Birth",
          Group = "Identity",
          SortOrder = 3,
          System = false,
          Format = "yyyy-MM-dd",
          Required = false
        },
        new()
        {
          Id = new Guid("67abfb94-cc26-48bd-9d80-9820fc2b4e76"),
          Name = "AccountVerificationMethods",
          NameDisplay = "Account Verification Methods",
          Description = "Confirmed email, mobile OTP and recorded social sign-in at issuance; not KYC or verification of profile details.",
          Group = "Identity",
          SortOrder = 7,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("702f1728-cf60-4544-ad57-0c10f1f2d472"),
          Name = "Region",
          NameDisplay = "Region",
          Description = "Self-declared profile region; not a verified address.",
          Group = "Identity",
          SortOrder = 10,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("128049d6-6d5b-4d8a-b6f2-5fc3d023bf04"),
          Name = "City",
          NameDisplay = "City",
          Description = "Self-declared profile city; not a verified address.",
          Group = "Identity",
          SortOrder = 11,
          System = false,
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
