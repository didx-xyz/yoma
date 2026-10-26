using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Test.Core.Fixtures
{
  internal static partial class CustomFieldFixtureData
  {
    private static List<CustomFieldDefinition> MyOpportunityJob() =>
    [
      new()
      {
        EntityType = "MyOpportunity",
        EntityContext = "Job",
        Key = "JobEmploymentStartDate",
        Title = "Employment Start Date",
        Description = "Actual placement start date, when known. Distinct from the Job application deadline; use yyyy-MM-dd.",
        Group = "Completion Details",
        DataType = CustomFieldDataType.Date,
        SortOrder = 3,
        IsActive = true,
        Options = []
      }
    ];
  }
}
