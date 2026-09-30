using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_CF_Configuration_Seeding_Jobs
  {
    #region Class Variables
    private static readonly string[] DefinitionColumns =
    [
      "Id", "EntityType", "EntityContext", "Key", "Title", "Description", "Group", "SubGroup",
      "DataType", "LookupType", "IsRequired", "SupportsMultiple", "SortOrder", "IsActive",
      "IsSystem", "IsSchemaMapped", "DateCreated", "DateModified"
    ];

    private static readonly string[] OptionColumns =
    [
      "Id", "CustomFieldDefinitionId", "Key", "Name", "SortOrder",
      "IsActive", "DateCreated", "DateModified"
    ];
    #endregion

    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Opportunity
      #region Custom Fields
      var created = DateTimeOffset.UtcNow;

      // Experience level is already seeded with Difficulty. Languages, deadline and required
      // skills reuse core fields. No historical salary, qualification or employment data is inferred.
      // Protect contracts interpreted by business rules or partner mappings; other CFs stay configurable.
      migrationBuilder.InsertData(
        schema: "Core",
        table: "CustomFieldDefinition",
        columns: DefinitionColumns,
        values: new object[,]
        {
          {
            new Guid("cf0b0001-0929-4cf0-a100-000000000001"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Job.ToString(),
            CustomFieldConstants.Job.Salary.Disclosed, "Salary disclosed", "Select Yes only when at least one salary amount is disclosed. No excludes all salary details.",
            "Job details", "Compensation", CustomFieldDataType.Boolean.ToString(), null!,
            true, null!, 10, true, true, false, created, created
          },
          {
            new Guid("cf0b0001-0929-4cf0-a100-000000000002"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Job.ToString(),
            CustomFieldConstants.Job.Salary.Minimum, "Minimum salary", "Optional lower amount, greater than zero. Requires salary disclosure, currency and pay interval on manual capture.",
            "Job details", "Compensation", CustomFieldDataType.Decimal.ToString(), null!,
            false, null!, 20, true, true, false, created, created
          },
          {
            new Guid("cf0b0001-0929-4cf0-a100-000000000003"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Job.ToString(),
            CustomFieldConstants.Job.Salary.Maximum, "Maximum salary", "Optional upper amount, greater than zero and not below minimum salary.",
            "Job details", "Compensation", CustomFieldDataType.Decimal.ToString(), null!,
            false, null!, 30, true, true, false, created, created
          },
          {
            new Guid("cf0b0001-0929-4cf0-a100-000000000004"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Job.ToString(),
            CustomFieldConstants.Job.Salary.Currency, "Salary currency", "Currency for the salary amounts. Select from the shared ISO currency lookup; no conversion is performed.",
            "Job details", "Compensation", CustomFieldDataType.Option.ToString(), CustomFieldLookupType.Currency.ToString(),
            false, false, 40, true, true, false, created, created
          },
          {
            new Guid("cf0b0001-0929-4cf0-a100-000000000005"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Job.ToString(),
            CustomFieldConstants.Job.Salary.PayInterval, "Pay interval", "Required when salary is disclosed on manual capture. Amounts refer to this interval, not necessarily a month.",
            "Job details", "Compensation", CustomFieldDataType.Option.ToString(), null!,
            false, false, 50, true, true, false, created, created
          },
          {
            new Guid("cf0b0001-0929-4cf0-a100-000000000006"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Job.ToString(),
            CustomFieldConstants.Job.Employment.Type, "Employment type", "Select compatible types. Permanent and Fixed-term cannot be combined. Permanent excludes duration.",
            "Job details", "Employment", CustomFieldDataType.Option.ToString(), null!,
            true, true, 10, true, true, false, created, created
          },
          {
            new Guid("cf0b0001-0929-4cf0-a100-000000000007"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Job.ToString(),
            CustomFieldConstants.Job.Employment.Schedule, "Work schedule", "Select Full-time or Part-time; this is separate from employment type.",
            "Job details", "Employment", CustomFieldDataType.Option.ToString(), null!,
            true, false, 20, true, true, false, created, created
          },
          {
            new Guid("cf0b0001-0929-4cf0-a100-000000000008"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Job.ToString(),
            CustomFieldConstants.Job.Employment.Duration, "Employment duration", "Positive whole number. Required with a unit on manual capture when employment is not permanent.",
            "Job details", "Employment", CustomFieldDataType.Integer.ToString(), null!,
            false, null!, 30, true, true, false, created, created
          },
          {
            new Guid("cf0b0001-0929-4cf0-a100-000000000009"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Job.ToString(),
            CustomFieldConstants.Job.Employment.DurationUnit, "Employment duration unit", "Months or Years, paired with employment duration. Leave empty for permanent employment.",
            "Job details", "Employment", CustomFieldDataType.Option.ToString(), null!,
            false, false, 40, true, true, false, created, created
          },
          {
            new Guid("cf0b0001-0929-4cf0-a100-000000000010"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Job.ToString(),
            "jobMinimumQualification", "Minimum qualification", "Minimum formal qualification; informational and searchable, not an automatic eligibility gate.",
            "Job details", "Requirements", CustomFieldDataType.Option.ToString(), CustomFieldLookupType.Education.ToString(),
            true, false, 20, true, false, false, created, created
          },
          {
            new Guid("cf0b0001-0929-4cf0-a100-000000000011"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Job.ToString(),
            "jobPreferredSkills", "Preferred skills", "Optional bonus skills; distinct from core required skills and never awarded on completion.",
            "Job details", "Requirements", CustomFieldDataType.Option.ToString(), CustomFieldLookupType.Skill.ToString(),
            false, true, 30, true, false, false, created, created
          },
          {
            new Guid("cf0b0001-0929-4cf0-a100-000000000012"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Job.ToString(),
            CustomFieldConstants.Job.Industry, "Industry", "Employer economic sector: UN ISIC Revision 5, Section level. Distinct from job function and opportunity categories.",
            "Job details", "Classification", CustomFieldDataType.Option.ToString(), null!,
            true, false, 10, true, true, false, created, created
          },
          {
            new Guid("cf0b0001-0929-4cf0-a100-000000000013"), CustomFieldEntityType.Opportunity.ToString(), Domain.Opportunity.Type.Job.ToString(),
            "jobCategory", "Job category", "Occupation/function: ISCO-08 two-digit Sub-major Group. Distinct from employer industry and opportunity categories.",
            "Job details", "Classification", CustomFieldDataType.Option.ToString(), null!,
            true, false, 20, true, false, false, created, created
          }
        });

      // Official classifications: retain codes as keys, including leading zeroes in ISCO-08.
      // Industry: https://unstats.un.org/unsd/classifications/Econ/isic (Revision 5, Sections).
      // Occupation: https://isco.ilo.org/en/isco-08/ (two-digit Sub-major Groups).
      migrationBuilder.InsertData(
        schema: "Core",
        table: "CustomFieldOption",
        columns: OptionColumns,
        values: new object[,]
        {
          { new Guid("cf0b0001-0929-4cf0-a100-000000000101"), new Guid("cf0b0001-0929-4cf0-a100-000000000005"), CustomFieldConstants.Job.Salary.PayIntervalOptions.PerYear, "Per year", 10, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000102"), new Guid("cf0b0001-0929-4cf0-a100-000000000005"), CustomFieldConstants.Job.Salary.PayIntervalOptions.PerMonth, "Per month", 20, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000103"), new Guid("cf0b0001-0929-4cf0-a100-000000000005"), CustomFieldConstants.Job.Salary.PayIntervalOptions.PerHour, "Per hour", 30, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000104"), new Guid("cf0b0001-0929-4cf0-a100-000000000005"), CustomFieldConstants.Job.Salary.PayIntervalOptions.PerEngagement, "Per engagement (once-off)", 40, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000105"), new Guid("cf0b0001-0929-4cf0-a100-000000000006"), EmploymentType.Permanent.ToString(), "Permanent", 10, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000106"), new Guid("cf0b0001-0929-4cf0-a100-000000000006"), EmploymentType.FixedTerm.ToString(), "Fixed-term", 20, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000107"), new Guid("cf0b0001-0929-4cf0-a100-000000000006"), "Internship", "Internship", 30, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000108"), new Guid("cf0b0001-0929-4cf0-a100-000000000006"), "Apprenticeship", "Apprenticeship", 40, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000109"), new Guid("cf0b0001-0929-4cf0-a100-000000000006"), "FreelanceConsultancy", "Freelance / Consultancy", 50, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000110"), new Guid("cf0b0001-0929-4cf0-a100-000000000006"), "TemporarySeasonal", "Temporary / Seasonal", 60, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000111"), new Guid("cf0b0001-0929-4cf0-a100-000000000007"), CustomFieldConstants.Job.Employment.ScheduleOptions.FullTime, "Full-time", 10, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000112"), new Guid("cf0b0001-0929-4cf0-a100-000000000007"), CustomFieldConstants.Job.Employment.ScheduleOptions.PartTime, "Part-time", 20, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000113"), new Guid("cf0b0001-0929-4cf0-a100-000000000009"), "Months", "Months", 10, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000114"), new Guid("cf0b0001-0929-4cf0-a100-000000000009"), "Years", "Years", 20, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000115"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "A", "Agriculture, forestry and fishing", 10, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000116"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "B", "Mining and quarrying", 20, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000117"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "C", "Manufacturing", 30, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000118"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "D", "Electricity, gas, steam and air conditioning supply", 40, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000119"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "E", "Water supply; sewerage, waste management and remediation activities", 50, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000120"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "F", "Construction", 60, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000121"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "G", "Wholesale and retail trade", 70, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000122"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "H", "Transportation and storage", 80, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000123"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "I", "Accommodation and food service activities", 90, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000124"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "J", "Publishing, broadcasting, and content production and distribution activities", 100, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000125"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "K", "Telecommunications, computer programming, consultancy, computing infrastructure, and other information service activities", 110, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000126"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "L", "Financial and insurance activities", 120, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000127"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "M", "Real estate activities", 130, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000128"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "N", "Professional, scientific and technical activities", 140, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000129"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "O", "Administrative and support service activities", 150, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000130"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "P", "Public administration and defence; compulsory social security", 160, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000131"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "Q", "Education", 170, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000132"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "R", "Human health and social work activities", 180, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000133"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "S", "Arts, sports and recreation", 190, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000134"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "T", "Other service activities", 200, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000135"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "U", "Activities of households as employers; undifferentiated goods- and services-producing activities of households for own use", 210, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000136"), new Guid("cf0b0001-0929-4cf0-a100-000000000012"), "V", "Activities of extraterritorial organizations and bodies", 220, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000137"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "11", "Chief Executives, Senior Officials and Legislators", 10, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000138"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "12", "Administrative and Commercial Managers", 20, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000139"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "13", "Production and Specialized Services Managers", 30, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000140"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "14", "Hospitality, Retail and Other Services Managers", 40, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000141"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "21", "Science and Engineering Professionals", 50, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000142"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "22", "Health Professionals", 60, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000143"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "23", "Teaching Professionals", 70, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000144"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "24", "Business and Administration Professionals", 80, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000145"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "25", "Information and Communications Technology Professionals", 90, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000146"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "26", "Legal, Social and Cultural Professionals", 100, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000147"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "31", "Science and Engineering Associate Professionals", 110, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000148"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "32", "Health Associate Professionals", 120, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000149"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "33", "Business and Administration Associate Professionals", 130, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000150"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "34", "Legal, Social, Cultural and Related Associate Professionals", 140, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000151"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "35", "Information and Communications Technicians", 150, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000152"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "41", "General and Keyboard Clerks", 160, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000153"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "42", "Customer Services Clerks", 170, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000154"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "43", "Numerical and Material Recording Clerks", 180, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000155"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "44", "Other Clerical Support Workers", 190, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000156"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "51", "Personal Services Workers", 200, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000157"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "52", "Sales Workers", 210, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000158"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "53", "Personal Care Workers", 220, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000159"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "54", "Protective Services Workers", 230, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000160"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "61", "Market-oriented Skilled Agricultural Workers", 240, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000161"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "62", "Market-oriented Skilled Forestry, Fishery and Hunting Workers", 250, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000162"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "63", "Subsistence Farmers, Fishers, Hunters and Gatherers", 260, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000163"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "71", "Building and Related Trades Workers (excluding Electricians)", 270, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000164"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "72", "Metal, Machinery and Related Trades Workers", 280, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000165"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "73", "Handicraft and Printing Workers", 290, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000166"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "74", "Electrical and Electronics Trades Workers", 300, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000167"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "75", "Food Processing, Woodworking, Garment and Other Craft and Related Trades Workers", 310, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000168"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "81", "Stationary Plant and Machine Operators", 320, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000169"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "82", "Assemblers", 330, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000170"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "83", "Drivers and Mobile Plant Operators", 340, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000171"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "91", "Cleaners and Helpers", 350, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000172"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "92", "Agricultural, Forestry and Fishery Labourers", 360, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000173"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "93", "Labourers in Mining, Construction, Manufacturing and Transport", 370, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000174"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "94", "Food Preparation Assistants", 380, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000175"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "95", "Street and Related Sales and Services Workers", 390, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000176"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "96", "Refuse Workers and Other Elementary Workers", 400, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000177"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "01", "Commissioned Armed Forces Officers", 410, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000178"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "02", "Non-commissioned Armed Forces Officers", 420, true, created, created },
          { new Guid("cf0b0001-0929-4cf0-a100-000000000179"), new Guid("cf0b0001-0929-4cf0-a100-000000000013"), "03", "Armed Forces Occupations, Other Ranks", 430, true, created, created }
        });
      #endregion
      #endregion
    }
  }
}

