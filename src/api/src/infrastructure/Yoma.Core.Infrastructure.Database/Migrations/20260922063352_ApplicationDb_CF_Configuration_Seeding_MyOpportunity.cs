using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_CF_Configuration_Seeding_MyOpportunity
  {
    #region Class Variables
    private static readonly string[] DefinitionColumns =
    [
      "Id", "EntityType", "EntityContext", "Key", "Title", "Description", "Group", "SubGroup",
      "DataType", "IsRequired", "SupportsMultiple", "ValidationRegex", "ValidationErrorMessage",
      "SortOrder", "IsActive", "IsSystem", "IsSchemaMapped", "DateCreated", "DateModified"
    ];

    private static readonly string[] OptionColumns =
    [
      "Id", "CustomFieldDefinitionId", "Key", "Name", "SortOrder",
      "IsActive", "DateCreated", "DateModified"
    ];
    #endregion

    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region MyOpportunity
      #region Custom Fields
      var created = new DateTimeOffset(2026, 9, 29, 0, 0, 0, TimeSpan.Zero);

      // These describe the individual completion, not the advertised Opportunity.
      // Existing completions have no inferred values. Credential schema mappings follow
      // in the final CF phase; capturing a value alone does not change issuance.
      migrationBuilder.InsertData(
        schema: "Core",
        table: "CustomFieldDefinition",
        columns: DefinitionColumns,
        values: new object[,]
        {
          {
            new Guid("cf0c0001-0929-4cf0-a100-000000000001"), CustomFieldEntityType.MyOpportunity.ToString(), Domain.Opportunity.Type.Job.ToString(),
            "jobEmploymentStartDate", "Employment start date", "Actual placement start date, when known. Distinct from the Job application deadline; use yyyy-MM-dd.",
            "Completion details", "Placement", CustomFieldDataType.Date.ToString(), false, null!,
            null!, null!, 10, true, false, false, created, created
          },
          {
            new Guid("cf0c0001-0929-4cf0-a100-000000000002"), CustomFieldEntityType.MyOpportunity.ToString(), Domain.Opportunity.Type.ImpactAction.ToString(),
            "impactActionImpactAchieved", "Impact achieved", "Describe the impact achieved by this completed action, when known.",
            "Completion details", "Impact", CustomFieldDataType.String.ToString(), false, null!,
            @"\A[\s\S]{1,1000}\z", "Impact achieved must be between 1 and 1000 characters.", 10, true, false, false, created, created
          },
          {
            new Guid("cf0c0001-0929-4cf0-a100-000000000003"), CustomFieldEntityType.MyOpportunity.ToString(), Domain.Opportunity.Type.Event.ToString(),
            "eventRole", "Event role", "Role at the event, when known. No role is inferred from attendance.",
            "Completion details", "Participation", CustomFieldDataType.Option.ToString(), false, false,
            null!, null!, 10, true, false, false, created, created
          }
        });

      migrationBuilder.InsertData(
        schema: "Core",
        table: "CustomFieldOption",
        columns: OptionColumns,
        values: new object[,]
        {
          { new Guid("cf0c0001-0929-4cf0-a100-000000000101"), new Guid("cf0c0001-0929-4cf0-a100-000000000003"), "Participant", "Participant", 10, true, created, created },
          { new Guid("cf0c0001-0929-4cf0-a100-000000000102"), new Guid("cf0c0001-0929-4cf0-a100-000000000003"), "Speaker", "Speaker", 20, true, created, created },
          { new Guid("cf0c0001-0929-4cf0-a100-000000000103"), new Guid("cf0c0001-0929-4cf0-a100-000000000003"), "Panelist", "Panelist", 30, true, created, created },
          { new Guid("cf0c0001-0929-4cf0-a100-000000000104"), new Guid("cf0c0001-0929-4cf0-a100-000000000003"), "FacilitatorTrainer", "Facilitator / Trainer", 40, true, created, created },
          { new Guid("cf0c0001-0929-4cf0-a100-000000000105"), new Guid("cf0c0001-0929-4cf0-a100-000000000003"), "CoOrganiser", "(Co-)organiser", 50, true, created, created },
          { new Guid("cf0c0001-0929-4cf0-a100-000000000106"), new Guid("cf0c0001-0929-4cf0-a100-000000000003"), "Volunteer", "Volunteer", 60, true, created, created }
        });
      #endregion
      #endregion
    }
  }
}
