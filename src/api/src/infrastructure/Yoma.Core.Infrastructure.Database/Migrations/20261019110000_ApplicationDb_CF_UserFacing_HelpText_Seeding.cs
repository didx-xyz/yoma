using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <summary>
  /// Replaces implementation-oriented custom-field descriptions with user-facing form guidance.
  /// Keys, options, validation rules, requiredness and captured values remain unchanged.
  /// </summary>
  internal static class ApplicationDb_CF_UserFacing_HelpText_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Opportunity - Custom Fields
      migrationBuilder.UpdateData(
        schema: "Core",
        table: "CustomFieldDefinition",
        keyColumn: "Id",
        keyValues:
        [
          new Guid("cf0b0001-0929-4cf0-a100-000000000001"),
          new Guid("cf0b0001-0929-4cf0-a100-000000000004"),
          new Guid("cf0b0001-0929-4cf0-a100-000000000005"),
          new Guid("cf0b0001-0929-4cf0-a100-000000000009"),
          new Guid("cf0b0001-0929-4cf0-a100-000000000010"),
          new Guid("cf0b0001-0929-4cf0-a100-000000000011"),
          new Guid("cf0b0001-0929-4cf0-a100-000000000012"),
          new Guid("cf0b0001-0929-4cf0-a100-000000000013"),
          new Guid("cf0a0001-0929-4cf0-a100-000000000003"),
          new Guid("cf0e0001-0929-4cf0-a100-000000000003")
        ],
        column: "Description",
        values:
        [
          "Choose Yes if you can share a salary amount. Choose No if the salary is not published.",
          "Choose the currency used for the salary amounts.",
          "Choose the period the salary amount covers, for example per month, per hour or once for the whole job.",
          "Choose Months or Years for the employment duration. Leave blank for permanent roles.",
          "Choose the minimum qualification applicants should have.",
          "Select extra skills that would be helpful but are not required for the role.",
          "Choose the industry the employer operates in, rather than the type of work the role involves.",
          "Choose the type of work the role involves, such as teaching or software development.",
          "Choose the activity or session participants will complete.",
          "Choose the business stage this programme is designed to support."
        ]);
      #endregion

      #region MyOpportunity - Custom Fields
      migrationBuilder.UpdateData(
        schema: "Core",
        table: "CustomFieldDefinition",
        keyColumn: "Id",
        keyValues:
        [
          new Guid("cf0c0001-0929-4cf0-a100-000000000001"),
          new Guid("cf0c0001-0929-4cf0-a100-000000000003"),
          new Guid("cf0e0001-0929-4cf0-a100-000000000014"),
          new Guid("cf0e0001-0929-4cf0-a100-000000000015"),
          new Guid("cf0e0001-0929-4cf0-a100-000000000016"),
          new Guid("cf0e0001-0929-4cf0-a100-000000000017"),
          new Guid("cf0e0001-0929-4cf0-a100-000000000018"),
          new Guid("cf0e0001-0929-4cf0-a100-000000000019"),
          new Guid("cf0e0001-0929-4cf0-a100-000000000020"),
          new Guid("cf0e0001-0929-4cf0-a100-000000000022")
        ],
        column: "Description",
        values:
        [
          "Enter the date employment started, if known. This is not the application deadline.",
          "Choose the participant's role at the event, if known.",
          "Enter the business registration number or document reference, if available. Leave blank if the business is not registered.",
          "Choose the industry the business operates in.",
          "Enter the number of jobs the business has created, not including the founder. Enter 0 if none.",
          "Choose the range for the business's monthly sales revenue, expressed in US dollars. Choose Pre-revenue if it has not started earning revenue. Leave blank if unknown.",
          "Choose the currency the business earns revenue in. The monthly revenue ranges are shown in US dollars.",
          "Select the types of funding the business has secured. Do not include pending applications.",
          "Choose the range for the total funding the business has secured, expressed in US dollars. Leave blank if unknown.",
          "Choose the area the business's customers come from, rather than the business address."
        ]);
      #endregion
    }
  }
}
