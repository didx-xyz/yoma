using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Test.Core.Fixtures
{
  internal static partial class CustomFieldFixtureData
  {
    private static List<CustomFieldDefinition> OpportunityEntrepreneurship() =>
    [
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Entrepreneurship",
        Key = "EntrepreneurshipProgrammeType",
        Title = "Programme",
        Description = "Programme under which this entrepreneurship opportunity is run. Select Other and describe an unlisted programme.",
        Group = "Programme",
        DataType = CustomFieldDataType.Option,
        SortOrder = 10,
        IsActive = true,
        IsSystem = true,
        Options = [
          Option("BeGreen", "BeGreen", 10),
          Option("EKYAN", "EKYAN", 20),
          Option("JACompanyProgramme", "JA Company Programme", 30),
          Option("UmuziVentures", "Umuzi Ventures", 40),
          Option("SupaMotoAcademy", "SupaMoto Academy", 50),
          Option("Other", "Other", 60)
        ]
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Entrepreneurship",
        Key = "EntrepreneurshipProgrammeOtherDescription",
        Title = "Other Programme",
        Description = "Required only when Other is selected. Name the programme, up to 255 characters.",
        Group = "Programme",
        DataType = CustomFieldDataType.String,
        ValidationRegex = "\\A[\\s\\S]{1,255}\\z",
        ValidationErrorMessage = "Other programme must be between 1 and 255 characters.",
        SortOrder = 20,
        IsActive = true,
        IsSystem = true,
        Options = []
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Entrepreneurship",
        Key = "EntrepreneurshipVentureStageTargeted",
        Title = "Venture Stage Targeted",
        Description = "Stage the programme is designed for; this does not assert the stage reached by a participant.",
        Group = "Programme",
        DataType = CustomFieldDataType.Option,
        SortOrder = 30,
        IsActive = true,
        Options = [
          Option("IdeaPreVenture", "Idea / pre-venture", 10),
          Option("InformalSelfEmployed", "Informal / self-employed", 20),
          Option("RegisteredEarlyStage", "Registered early-stage (under 2 years)", 30),
          Option("EstablishedGrowth", "Established / growth (2+ years)", 40)
        ]
      }
    ];
  }
}
