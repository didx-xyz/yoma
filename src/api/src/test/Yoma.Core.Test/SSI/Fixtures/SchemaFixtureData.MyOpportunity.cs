using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Test.SSI.Fixtures
{
  internal static partial class SchemaFixtureData
  {
    private static SSISchemaEntity MyOpportunity() =>
    new()
    {
      Id = new Guid("ca11d9d0-39f6-46d8-a0d3-350ec41402f5"),
      Name = "MyOpportunity",
      TypeName = "Yoma.Core.Domain.MyOpportunity.Models.MyOpportunity",
      Properties = [
        new()
        {
          Id = new Guid("a3e3ff94-67e0-4a03-983f-8d3d5df5b56a"),
          Name = "UserDisplayName",
          NameDisplay = "User",
          Description = "User Display Name",
          Group = "Completion Details",
          SortOrder = 1,
          System = false,
          Required = true
        },
        new()
        {
          Id = new Guid("cb8de9bf-4c7c-429e-9b99-d92c9c6d79a0"),
          Name = "UserDateOfBirth",
          NameDisplay = "User Date Of Birth",
          Description = "User Date of Birth",
          Group = "Completion Details",
          SortOrder = 21,
          System = false,
          Format = "yyyy-MM-dd",
          Required = false
        },
        new()
        {
          Id = new Guid("8ad09b9c-61a1-4a68-b401-e926dd84e9dc"),
          Name = "DateCompleted",
          NameDisplay = "Completion Date",
          Description = "Completion Date",
          Group = "Completion Details",
          SortOrder = 19,
          System = false,
          Format = "yyyy-MM-dd",
          Required = false
        },
        new()
        {
          Id = new Guid("682974e4-7aab-4060-8a27-426f91c02add"),
          Name = "ZltoReward",
          NameDisplay = "ZLTO Reward",
          Description = "Zlto Reward",
          Group = "Completion Details",
          SortOrder = 20,
          System = false,
          Format = "Z0.00",
          Required = false
        },
        new()
        {
          Id = new Guid("cabd88de-1b10-4b79-bae9-dfe3e8862dde"),
          Name = "CommitmentIntervalDescription",
          NameDisplay = "Duration",
          Description = "Recorded participation commitment and unit; not an independently verified measure of time spent.",
          Group = "Completion Details",
          SortOrder = 16,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("db902ae7-7f9a-439b-90bf-e883af5b43f9"),
          Name = "Verifications.VerificationTypeDisplayName",
          NameDisplay = "Evidence Types Submitted",
          Description = "Types of evidence actually submitted; excludes file links, geometry and configured but unused evidence types.",
          Group = "Completion Details",
          SortOrder = 22,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("ebf31029-cf82-447c-8ceb-7b94517b30ad"),
          Name = "VerificationEvidence",
          NameDisplay = "Verification Evidence",
          Description = "Submitted evidence types, or the recorded action-link, CSV or partner verification comment; excludes private artifacts.",
          Group = "Completion Details",
          SortOrder = 18,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("52ccf9a4-9866-4fa2-9a59-85a2b030914a"),
          Name = "Location",
          NameDisplay = "Location",
          Description = "Stored participation or explicit business country, region and city; not opportunity availability or verified attendance.",
          Group = "Completion Details",
          SortOrder = 15,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("a2345df0-4c07-42e7-9fda-76fd867ea38e"),
          Name = "Country",
          NameDisplay = "Country",
          Description = "Participation or explicit business country captured at submission; no historical backfill.",
          Group = "Completion Details",
          SortOrder = 23,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("cc65bb9d-724c-488d-94df-2b5604cc9c5e"),
          Name = "Region",
          NameDisplay = "Region",
          Description = "Participation or business region captured at submission, when supplied with a country.",
          Group = "Completion Details",
          SortOrder = 24,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("d627361d-39b0-4db9-9b96-cf39d8dafcd6"),
          Name = "City",
          NameDisplay = "City",
          Description = "Participation or business city captured at submission, when supplied with a country.",
          Group = "Completion Details",
          SortOrder = 25,
          System = false,
          Required = false
        }
      ],
      Types = [
        new()
        {
          Id = new Guid("7818b5c3-3d57-4264-b90b-df53eaa9f749"),
          Type = SchemaType.Opportunity,
          Name = "Opportunity",
          SupportMultiple = true
        }
      ]
    };
  }
}
