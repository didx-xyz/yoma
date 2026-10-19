using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  /// <summary>
  /// Adds an unspecified-term Contract option and clarifies the existing employment/salary metadata.
  /// Existing option identities, selections and protection flags remain unchanged.
  /// </summary>
  internal static class ApplicationDb_Job_Employment_Contract_Seeding
  {
    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Opportunity - Custom Fields
      var created = DateTimeOffset.UtcNow;

      migrationBuilder.InsertData(
        schema: "Core",
        table: "CustomFieldOption",
        columns: ["Id", "CustomFieldDefinitionId", "Key", "Name", "SortOrder", "IsActive", "DateCreated", "DateModified"],
        values: [new Guid("cf0b0001-0929-4cf0-a100-000000000188"), new Guid("cf0b0001-0929-4cf0-a100-000000000006"),
          EmploymentType.Contract.ToString(), "Contract", 25, true, created, created]);

      migrationBuilder.UpdateData(
        schema: "Core",
        table: "CustomFieldDefinition",
        keyColumn: "Id",
        keyValues:
        [
          new Guid("cf0b0001-0929-4cf0-a100-000000000002"),
          new Guid("cf0b0001-0929-4cf0-a100-000000000003"),
          new Guid("cf0b0001-0929-4cf0-a100-000000000006"),
          new Guid("cf0b0001-0929-4cf0-a100-000000000008")
        ],
        column: "Description",
        values:
        [
          "Enter the lowest salary offered. For an exact salary, enter the same amount in Minimum Salary and Maximum Salary. If there is no upper limit, leave Maximum Salary blank. Also choose the currency and pay period.",
          "Enter the highest salary offered. If only a maximum is known, leave Minimum Salary blank. For an exact salary, enter the same amount in both fields. The maximum cannot be lower than the minimum.",
          "Choose all types that apply. Permanent has no fixed end date; Fixed-term has an agreed term. Contract can be used when the term is not known. Internship offers work experience; Apprenticeship offers trade training. Freelance / Consultancy covers independent services; Temporary / Seasonal covers short-term or seasonal work. Do not select both Permanent and Fixed-term. Choose full-time or part-time separately under Work Schedule.",
          "Enter how long the role lasts as a whole number, then choose Months or Years. Leave blank for permanent roles. For Contract alone, you can leave this blank if the term is unknown. Other non-permanent types need a duration."
        ]);
      #endregion
    }
  }
}
