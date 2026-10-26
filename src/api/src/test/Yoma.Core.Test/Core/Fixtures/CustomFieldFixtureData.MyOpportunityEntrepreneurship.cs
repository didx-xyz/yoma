using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Test.Core.Fixtures
{
  internal static partial class CustomFieldFixtureData
  {
    private static List<CustomFieldDefinition> MyOpportunityEntrepreneurship() =>
    [
      new()
      {
        EntityType = "MyOpportunity",
        EntityContext = "Entrepreneurship",
        Key = "EntrepreneurshipBusinessName",
        Title = "Business / Venture Name",
        Description = "Venture or trading name. Informal self-employment can use a descriptive trading name.",
        Group = "Completion Details",
        DataType = CustomFieldDataType.String,
        ValidationRegex = "\\A[\\s\\S]{1,255}\\z",
        ValidationErrorMessage = "Business / venture name must be between 1 and 255 characters.",
        IsRequired = true,
        SortOrder = 3,
        IsActive = true,
        Options = []
      },
      new()
      {
        EntityType = "MyOpportunity",
        EntityContext = "Entrepreneurship",
        Key = "EntrepreneurshipBusinessSummary",
        Title = "Business Summary",
        Description = "Briefly describe what the venture does and who it serves, up to 300 characters.",
        Group = "Completion Details",
        DataType = CustomFieldDataType.String,
        ValidationRegex = "\\A[\\s\\S]{1,300}\\z",
        ValidationErrorMessage = "Business summary must be between 1 and 300 characters.",
        IsRequired = true,
        SortOrder = 4,
        IsActive = true,
        Options = []
      },
      new()
      {
        EntityType = "MyOpportunity",
        EntityContext = "Entrepreneurship",
        Key = "EntrepreneurshipBusinessRegistered",
        Title = "Business Registered",
        Description = "Select No for an informal or unregistered venture; registration is not a condition of participation.",
        Group = "Completion Details",
        DataType = CustomFieldDataType.Boolean,
        IsRequired = true,
        SortOrder = 5,
        IsActive = true,
        Options = []
      },
      new()
      {
        EntityType = "MyOpportunity",
        EntityContext = "Entrepreneurship",
        Key = "EntrepreneurshipRegistrationReference",
        Title = "Registration Reference",
        Description = "Optional registration number or document reference when the venture is registered. Never use a placeholder for an informal venture.",
        Group = "Completion Details",
        DataType = CustomFieldDataType.String,
        ValidationRegex = "\\A[\\s\\S]{1,125}\\z",
        ValidationErrorMessage = "Registration reference must be between 1 and 125 characters.",
        SortOrder = 6,
        IsActive = true,
        Options = []
      },
      new()
      {
        EntityType = "MyOpportunity",
        EntityContext = "Entrepreneurship",
        Key = "EntrepreneurshipSector",
        Title = "Business Sector",
        Description = "Economic sector of this venture: UN ISIC Revision 5, Section level. Distinct from the programme's Opportunity category.",
        Group = "Completion Details",
        DataType = CustomFieldDataType.Option,
        SortOrder = 7,
        IsActive = true,
        Options = []
      },
      new()
      {
        EntityType = "MyOpportunity",
        EntityContext = "Entrepreneurship",
        Key = "EntrepreneurshipJobsCreated",
        Title = "Jobs Created",
        Description = "Number of jobs created by the venture, excluding the founder. Zero is a valid reported outcome.",
        Group = "Completion Details",
        DataType = CustomFieldDataType.Integer,
        ValidationRegex = "\\A(?:0|[1-9][0-9]*)\\z",
        ValidationErrorMessage = "Jobs created must be zero or a positive whole number.",
        SortOrder = 8,
        IsActive = true,
        Options = []
      },
      new()
      {
        EntityType = "MyOpportunity",
        EntityContext = "Entrepreneurship",
        Key = "EntrepreneurshipRevenueBand",
        Title = "Monthly Revenue Band",
        Description = "Monthly business revenue in USD-equivalent bands. Pre-revenue means no income yet; an omitted value means not reported.",
        Group = "Completion Details",
        DataType = CustomFieldDataType.Option,
        SortOrder = 9,
        IsActive = true,
        Options = [
          Option("PreRevenue", "Pre-revenue", 10),
          Option("Under100", "Under $100 / month", 20),
          Option("From100To500", "$100–$500 / month", 30),
          Option("From500To2000", "$500–$2,000 / month", 40),
          Option("From2000To10000", "$2,000–$10,000 / month", 50),
          Option("Over10000", "Over $10,000 / month", 60)
        ]
      },
      new()
      {
        EntityType = "MyOpportunity",
        EntityContext = "Entrepreneurship",
        Key = "EntrepreneurshipRevenueCurrency",
        Title = "Revenue Currency",
        Description = "Currency in which the business earns revenue. Informational; the monthly band uses USD-equivalent thresholds.",
        Group = "Completion Details",
        DataType = CustomFieldDataType.Option,
        LookupType = CustomFieldLookupType.Currency,
        SortOrder = 10,
        IsActive = true,
        Options = []
      },
      new()
      {
        EntityType = "MyOpportunity",
        EntityContext = "Entrepreneurship",
        Key = "EntrepreneurshipFundingTypes",
        Title = "Funding Acquired",
        Description = "Types of funding actually secured by the venture, when known. This does not represent funding merely applied for.",
        Group = "Completion Details",
        DataType = CustomFieldDataType.Option,
        SupportsMultiple = true,
        SortOrder = 11,
        IsActive = true,
        Options = [
          Option("Grant", "Grant", 10),
          Option("SeedAngel", "Seed / angel", 20),
          Option("Equity", "Equity", 30),
          Option("FormalLoan", "Loan (formal)", 40),
          Option("CommunityFinance", "Community finance", 50),
          Option("FamilyFriends", "Family & friends", 60),
          Option("CompetitionPrize", "Competition prize", 70),
          Option("InKind", "In-kind", 80)
        ]
      },
      new()
      {
        EntityType = "MyOpportunity",
        EntityContext = "Entrepreneurship",
        Key = "EntrepreneurshipFundingAmountBand",
        Title = "Funding Amount Band",
        Description = "Total funding secured, in USD-equivalent bands, when known.",
        Group = "Completion Details",
        DataType = CustomFieldDataType.Option,
        SortOrder = 12,
        IsActive = true,
        Options = [
          Option("Under500", "Under $500", 10),
          Option("From500To2000", "$500–$2,000", 20),
          Option("From2000To10000", "$2,000–$10,000", 30),
          Option("From10000To50000", "$10,000–$50,000", 40),
          Option("Over50000", "Over $50,000", 50)
        ]
      },
      new()
      {
        EntityType = "MyOpportunity",
        EntityContext = "Entrepreneurship",
        Key = "EntrepreneurshipFunder",
        Title = "Funder",
        Description = "Name of the funder or funding programme, when known.",
        Group = "Completion Details",
        DataType = CustomFieldDataType.String,
        ValidationRegex = "\\A[\\s\\S]{1,255}\\z",
        ValidationErrorMessage = "Funder must be between 1 and 255 characters.",
        SortOrder = 13,
        IsActive = true,
        Options = []
      },
      new()
      {
        EntityType = "MyOpportunity",
        EntityContext = "Entrepreneurship",
        Key = "EntrepreneurshipCustomerReach",
        Title = "Customer Reach",
        Description = "Broad reach of the venture's customers, not a precise business location.",
        Group = "Completion Details",
        DataType = CustomFieldDataType.Option,
        SortOrder = 14,
        IsActive = true,
        Options = [
          Option("LocalCommunity", "Same community / local", 10),
          Option("Regional", "Regional (within country)", 20),
          Option("National", "National", 30),
          Option("CrossBorder", "Cross-border / regional trade", 40),
          Option("InternationalOnline", "International / online export", 50)
        ]
      }
    ];
  }
}
