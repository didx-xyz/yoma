using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Test.Core.Fixtures
{
  internal static partial class CustomFieldFixtureData
  {
    private static List<CustomFieldDefinition> OpportunityJob() =>
    [
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Job",
        Key = "JobExperienceLevel",
        Title = "Experience Level",
        Group = "Requirements",
        DataType = CustomFieldDataType.Option,
        IsRequired = true,
        SortOrder = 10,
        IsActive = true,
        Options = [
          Option("None", "None (No previous experience required)", 10),
          Option("EntryJunior", "Entry / Junior (1–3 years)", 20),
          Option("Mid", "Mid (4–6 years)", 30),
          Option("Senior", "Senior (7+ years)", 40)
        ]
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Job",
        Key = "JobSalaryDisclosed",
        Title = "Salary Disclosed",
        Description = "Select Yes only when at least one salary amount is disclosed. No excludes all salary details.",
        Group = "Compensation",
        DataType = CustomFieldDataType.Boolean,
        IsRequired = true,
        SortOrder = 10,
        IsActive = true,
        IsSystem = true,
        Options = []
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Job",
        Key = "JobSalaryMinimum",
        Title = "Minimum Salary",
        Description = "Optional lower amount, greater than zero. Requires salary disclosure, currency and pay interval on manual capture.",
        Group = "Compensation",
        DataType = CustomFieldDataType.Decimal,
        SortOrder = 20,
        IsActive = true,
        IsSystem = true,
        Options = []
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Job",
        Key = "JobSalaryMaximum",
        Title = "Maximum Salary",
        Description = "Optional upper amount, greater than zero and not below minimum salary.",
        Group = "Compensation",
        DataType = CustomFieldDataType.Decimal,
        SortOrder = 30,
        IsActive = true,
        IsSystem = true,
        Options = []
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Job",
        Key = "JobSalaryCurrency",
        Title = "Salary Currency",
        Description = "Currency for the salary amounts. Select from the shared ISO currency lookup; no conversion is performed.",
        Group = "Compensation",
        DataType = CustomFieldDataType.Option,
        LookupType = CustomFieldLookupType.Currency,
        SortOrder = 40,
        IsActive = true,
        IsSystem = true,
        Options = []
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Job",
        Key = "JobPayInterval",
        Title = "Pay Interval",
        Description = "Required when salary is disclosed on manual capture. Amounts refer to this interval, not necessarily a month.",
        Group = "Compensation",
        DataType = CustomFieldDataType.Option,
        SortOrder = 50,
        IsActive = true,
        IsSystem = true,
        Options = [
          Option("PerYear", "Per year", 10),
          Option("PerMonth", "Per month", 20),
          Option("PerHour", "Per hour", 30),
          Option("PerEngagement", "Per engagement (once-off)", 40)
        ]
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Job",
        Key = "JobEmploymentType",
        Title = "Employment Type",
        Description = "Select compatible types. Permanent and Fixed-term cannot be combined. Permanent excludes duration.",
        Group = "Employment",
        DataType = CustomFieldDataType.Option,
        IsRequired = true,
        SupportsMultiple = true,
        SortOrder = 10,
        IsActive = true,
        IsSystem = true,
        Options = [
          Option("Permanent", "Permanent", 10),
          Option("FixedTerm", "Fixed-term", 20),
          Option("Internship", "Internship", 30),
          Option("Apprenticeship", "Apprenticeship", 40),
          Option("FreelanceConsultancy", "Freelance / Consultancy", 50),
          Option("TemporarySeasonal", "Temporary / Seasonal", 60),
          Option("Contract", "Contract", 25)
        ]
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Job",
        Key = "JobWorkSchedule",
        Title = "Work Schedule",
        Description = "Select Full-time or Part-time; this is separate from employment type.",
        Group = "Employment",
        DataType = CustomFieldDataType.Option,
        IsRequired = true,
        SortOrder = 20,
        IsActive = true,
        IsSystem = true,
        Options = [
          Option("FullTime", "Full-time", 10),
          Option("PartTime", "Part-time", 20)
        ]
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Job",
        Key = "JobEmploymentDuration",
        Title = "Employment Duration",
        Description = "Positive whole number. Required with a unit on manual capture when employment is not permanent.",
        Group = "Employment",
        DataType = CustomFieldDataType.Integer,
        SortOrder = 30,
        IsActive = true,
        IsSystem = true,
        Options = []
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Job",
        Key = "JobEmploymentDurationUnit",
        Title = "Employment Duration Unit",
        Description = "Months or Years, paired with employment duration. Leave empty for permanent employment.",
        Group = "Employment",
        DataType = CustomFieldDataType.Option,
        SortOrder = 40,
        IsActive = true,
        IsSystem = true,
        Options = [
          Option("Months", "Months", 10),
          Option("Years", "Years", 20)
        ]
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Job",
        Key = "JobMinimumQualification",
        Title = "Minimum Qualification",
        Description = "Minimum formal qualification; informational and searchable, not an automatic eligibility gate.",
        Group = "Requirements",
        DataType = CustomFieldDataType.Option,
        LookupType = CustomFieldLookupType.Education,
        IsRequired = true,
        SortOrder = 20,
        IsActive = true,
        Options = []
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Job",
        Key = "JobPreferredSkills",
        Title = "Preferred Skills",
        Description = "Optional bonus skills; distinct from core required skills and never awarded on completion.",
        Group = "Requirements",
        DataType = CustomFieldDataType.Option,
        LookupType = CustomFieldLookupType.Skill,
        SupportsMultiple = true,
        SortOrder = 30,
        IsActive = true,
        Options = []
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Job",
        Key = "JobIndustry",
        Title = "Industry",
        Description = "Employer economic sector: UN ISIC Revision 5, Section level. Distinct from job function and opportunity categories.",
        Group = "Classification",
        DataType = CustomFieldDataType.Option,
        IsRequired = true,
        SortOrder = 10,
        IsActive = true,
        IsSystem = true,
        Options = [
          Option("A", "Agriculture, forestry and fishing", 10),
          Option("B", "Mining and quarrying", 20),
          Option("C", "Manufacturing", 30),
          Option("D", "Electricity, gas, steam and air conditioning supply", 40),
          Option("E", "Water supply; sewerage, waste management and remediation activities", 50),
          Option("F", "Construction", 60),
          Option("G", "Wholesale and retail trade", 70),
          Option("H", "Transportation and storage", 80),
          Option("I", "Accommodation and food service activities", 90),
          Option("J", "Publishing, broadcasting, and content production and distribution activities", 100),
          Option("K", "Telecommunications, computer programming, consultancy, computing infrastructure, and other information service activities", 110),
          Option("L", "Financial and insurance activities", 120),
          Option("M", "Real estate activities", 130),
          Option("N", "Professional, scientific and technical activities", 140),
          Option("O", "Administrative and support service activities", 150),
          Option("P", "Public administration and defence; compulsory social security", 160),
          Option("Q", "Education", 170),
          Option("R", "Human health and social work activities", 180),
          Option("S", "Arts, sports and recreation", 190),
          Option("T", "Other service activities", 200),
          Option("U", "Activities of households as employers; undifferentiated goods- and services-producing activities of households for own use", 210),
          Option("V", "Activities of extraterritorial organizations and bodies", 220)
        ]
      },
      new()
      {
        EntityType = "Opportunity",
        EntityContext = "Job",
        Key = "JobCategory",
        Title = "Job Category",
        Description = "Occupation/function: ISCO-08 two-digit Sub-major Group. Distinct from employer industry and opportunity categories.",
        Group = "Classification",
        DataType = CustomFieldDataType.Option,
        IsRequired = true,
        SortOrder = 20,
        IsActive = true,
        Options = [
          Option("11", "Chief Executives, Senior Officials and Legislators", 10),
          Option("12", "Administrative and Commercial Managers", 20),
          Option("13", "Production and Specialized Services Managers", 30),
          Option("14", "Hospitality, Retail and Other Services Managers", 40),
          Option("21", "Science and Engineering Professionals", 50),
          Option("22", "Health Professionals", 60),
          Option("23", "Teaching Professionals", 70),
          Option("24", "Business and Administration Professionals", 80),
          Option("25", "Information and Communications Technology Professionals", 90),
          Option("26", "Legal, Social and Cultural Professionals", 100),
          Option("31", "Science and Engineering Associate Professionals", 110),
          Option("32", "Health Associate Professionals", 120),
          Option("33", "Business and Administration Associate Professionals", 130),
          Option("34", "Legal, Social, Cultural and Related Associate Professionals", 140),
          Option("35", "Information and Communications Technicians", 150),
          Option("41", "General and Keyboard Clerks", 160),
          Option("42", "Customer Services Clerks", 170),
          Option("43", "Numerical and Material Recording Clerks", 180),
          Option("44", "Other Clerical Support Workers", 190),
          Option("51", "Personal Services Workers", 200),
          Option("52", "Sales Workers", 210),
          Option("53", "Personal Care Workers", 220),
          Option("54", "Protective Services Workers", 230),
          Option("61", "Market-oriented Skilled Agricultural Workers", 240),
          Option("62", "Market-oriented Skilled Forestry, Fishery and Hunting Workers", 250),
          Option("63", "Subsistence Farmers, Fishers, Hunters and Gatherers", 260),
          Option("71", "Building and Related Trades Workers (excluding Electricians)", 270),
          Option("72", "Metal, Machinery and Related Trades Workers", 280),
          Option("73", "Handicraft and Printing Workers", 290),
          Option("74", "Electrical and Electronics Trades Workers", 300),
          Option("75", "Food Processing, Woodworking, Garment and Other Craft and Related Trades Workers", 310),
          Option("81", "Stationary Plant and Machine Operators", 320),
          Option("82", "Assemblers", 330),
          Option("83", "Drivers and Mobile Plant Operators", 340),
          Option("91", "Cleaners and Helpers", 350),
          Option("92", "Agricultural, Forestry and Fishery Labourers", 360),
          Option("93", "Labourers in Mining, Construction, Manufacturing and Transport", 370),
          Option("94", "Food Preparation Assistants", 380),
          Option("95", "Street and Related Sales and Services Workers", 390),
          Option("96", "Refuse Workers and Other Elementary Workers", 400),
          Option("01", "Commissioned Armed Forces Officers", 410),
          Option("02", "Non-commissioned Armed Forces Officers", 420),
          Option("03", "Armed Forces Occupations, Other Ranks", 430)
        ]
      }
    ];
  }
}
