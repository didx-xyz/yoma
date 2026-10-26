using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Test.SSI.Fixtures
{
  internal static partial class SchemaFixtureData
  {
    private static SSISchemaEntity Opportunity() =>
    new()
    {
      Id = new Guid("e8ae5b9b-11ae-4ecb-8f6c-020a3d6a5c3d"),
      Name = "Opportunity",
      TypeName = "Yoma.Core.Domain.Opportunity.Models.Opportunity",
      Properties = [
        new()
        {
          Id = new Guid("7da9b94b-5158-4a62-9993-a6fad6e5ea23"),
          Name = "Title",
          NameDisplay = "Title",
          Description = "Title",
          System = true,
          SystemType = SchemaEntityPropertySystemType.Title,
          Required = true
        },
        new()
        {
          Id = new Guid("5fad171f-3e8c-4db5-86fa-c4029fe29f22"),
          Name = "Summary",
          NameDisplay = "Summary",
          Description = "Summary",
          Group = "Opportunity Details",
          SortOrder = 3,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("755b1f54-1365-4d2f-af29-8aec57cc7b4c"),
          Name = "Type",
          NameDisplay = "Type",
          Description = "i.e. Learning",
          Group = "Opportunity Details",
          SortOrder = 1,
          System = true,
          SystemType = SchemaEntityPropertySystemType.OpportunityType,
          Required = true
        },
        new()
        {
          Id = new Guid("e763c235-f1b8-4d12-b60f-117af7948355"),
          Name = "OrganizationName",
          NameDisplay = "Organization Name",
          Description = "Organization Name",
          System = true,
          SystemType = SchemaEntityPropertySystemType.Issuer,
          Required = true
        },
        new()
        {
          Id = new Guid("79e64f8f-5b1e-4de2-88d4-2148e30cc49c"),
          Name = "OrganizationLogoURL",
          NameDisplay = "Organization Logo URL",
          Description = "Organization Logo Url",
          System = true,
          SystemType = SchemaEntityPropertySystemType.IssuerLogoURL,
          Required = false
        },
        new()
        {
          Id = new Guid("ff423d0c-2e91-48a6-9245-28eef6e96b01"),
          Name = "Difficulty",
          NameDisplay = "Difficulty",
          Description = "i.e. Intermediate",
          Group = "Opportunity Details",
          SortOrder = 2,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("f4baa24b-463f-4b74-ba81-7cc5dcbe8df5"),
          Name = "Skills.Name",
          NameDisplay = "Skills Earned",
          Description = "Skills",
          Group = "Completion Details",
          SortOrder = 2,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("0e54c681-c7c9-476e-a5c9-0c7433220bd6"),
          Name = "Countries.LocationDisplayName",
          NameDisplay = "Opportunity Location",
          Description = "Country, region and city where the opportunity is offered; not evidence of the youth's physical location.",
          Group = "Opportunity Details",
          SortOrder = 5,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("7df0110b-6fef-46c0-87de-c0a573b0999b"),
          Name = "EngagementType",
          NameDisplay = "Engagement",
          Description = "Declared remote, on-site or hybrid engagement; separate from opportunity location.",
          Group = "Opportunity Details",
          SortOrder = 6,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("8c32151b-0da9-4a35-9426-1a4bb713fd41"),
          Name = "VerificationMethod",
          NameDisplay = "Verification Method",
          Description = "Opportunity's configured manual or automatic method; not an independent record of the route used for this completion.",
          Group = "Completion Details",
          SortOrder = 17,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("b0e493a0-e202-45ac-9753-2e3f359c02dd"),
          Name = "Description",
          NameDisplay = "Opportunity Description",
          Description = "Programme description; not the youth's personal completion outcome.",
          Group = "Opportunity Details",
          SortOrder = 4,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("3b7f7fe4-bbf8-4f32-ab25-072b32b4bb33"),
          Name = "Provider",
          NameDisplay = "Provider",
          Description = "Informational provider; the owning organisation remains the credential issuer.",
          Group = "Provider",
          SortOrder = 1,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("3cfca090-30d0-4d9e-af30-a961fe346e24"),
          Name = "ProviderURL",
          NameDisplay = "Provider URL",
          Description = "Optional provider website URL; not a logo, evidence or credential issuer reference.",
          Group = "Provider",
          SortOrder = 2,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("49203c8a-b161-46f2-a662-8cbd25d5e5ee"),
          Name = "ProviderLogoURL",
          NameDisplay = "Provider Logo URL",
          Description = "Optional provider logo image URL, separate from its website and the owning organisation's logo.",
          Group = "Provider",
          SortOrder = 3,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("92f51238-ce42-42fd-9073-de3d3f7cafbc"),
          Name = "ProviderCountry",
          NameDisplay = "Provider Country",
          Description = "Specific provider origin for discoverability; not opportunity availability or participation location.",
          Group = "Provider",
          SortOrder = 4,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("b60cd672-2c12-4915-8d92-6ee1345c03c8"),
          Name = "Categories.Name",
          NameDisplay = "Opportunity Categories",
          Description = "Selected programme categories, not Job occupation or industry.",
          Group = "Opportunity Details",
          SortOrder = 7,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("73c911ce-2473-488a-a1d5-d99b01252e74"),
          Name = "Languages.Name",
          NameDisplay = "Opportunity Languages",
          Description = "Languages declared for this opportunity; not the youth's proficiency.",
          Group = "Opportunity Details",
          SortOrder = 8,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("f803c469-cec1-4ac9-b4ec-b45a412de5dd"),
          Name = "DateStart",
          NameDisplay = "Opportunity Start Date",
          Description = "Programme start date; not the youth's participation or employment start.",
          Group = "Opportunity Details",
          SortOrder = 9,
          System = false,
          Format = "yyyy-MM-dd",
          Required = false
        },
        new()
        {
          Id = new Guid("da6413d2-1552-4fdc-b7d0-9b0c97ef4ba2"),
          Name = "DateEnd",
          NameDisplay = "Opportunity End Date",
          Description = "Programme end or Job application deadline; not the end of employment.",
          Group = "Opportunity Details",
          SortOrder = 10,
          System = false,
          Format = "yyyy-MM-dd",
          Required = false
        },
        new()
        {
          Id = new Guid("61f99152-4fce-4d64-8864-2db7e828f437"),
          Name = "CommitmentIntervalDescription",
          NameDisplay = "Advertised Commitment",
          Description = "Advertised effort and unit, separate from recorded participation commitment.",
          Group = "Opportunity Details",
          SortOrder = 11,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("a0134715-0f4e-4f81-8509-d60df178a68c"),
          Name = "Incentivized",
          NameDisplay = "Incentivized",
          Description = "Whether an incentive was declared; absent does not mean no incentive.",
          Group = "Incentives",
          SortOrder = 1,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("399c7ac6-e69e-4b15-97e5-562a21e58bf0"),
          Name = "RewardType",
          NameDisplay = "Reward Type",
          Description = "Declared reward type; does not attest that payment was made.",
          Group = "Incentives",
          SortOrder = 2,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("bd1109d2-5b27-4761-9cb7-f8f6f67717d6"),
          Name = "PartnerIncentiveAmount",
          NameDisplay = "Partner Incentive Amount",
          Description = "Informational partner-funded amount; not proof of payment or a Yoma award.",
          Group = "Incentives",
          SortOrder = 3,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("bb5d1f99-5698-45d0-8021-d69c8bbe5193"),
          Name = "PartnerIncentiveCurrency",
          NameDisplay = "Partner Incentive Currency",
          Description = "ISO currency code of the declared partner incentive; not ZLTO.",
          Group = "Incentives",
          SortOrder = 4,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("cab4d8c1-ab26-4a2e-a481-c1b6b9b63550"),
          Name = "ZltoReward",
          NameDisplay = "Advertised ZLTO Reward",
          Description = "Advertised ZLTO amount, separate from the recorded completion award.",
          Group = "Incentives",
          SortOrder = 5,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("d0a5b77c-7105-4bd7-ae76-0f764a2923de"),
          Name = "AccessibilitySupport",
          NameDisplay = "Accessibility Support",
          Description = "Declared support; unspecified does not confirm an accommodation.",
          Group = "Accessibility",
          SortOrder = 1,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("50c4d875-4a19-4d4c-9fb2-2b959e6ead7f"),
          Name = "Accommodations.Name",
          NameDisplay = "Available Accommodations",
          Description = "Declared accommodations, not a disclosure of the youth's accessibility needs.",
          Group = "Accessibility",
          SortOrder = 2,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("e10c2be4-cd24-4291-92a9-42fd8cfc888c"),
          Name = "AccommodationOtherDescription",
          NameDisplay = "Other Accommodation",
          Description = "Description of the provider's Other accommodation.",
          Group = "Accessibility",
          SortOrder = 3,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("61b6a05e-8402-4f56-b6ba-0d0488467bc8"),
          Name = "AgeFrom",
          NameDisplay = "Minimum Age",
          Description = "Inclusive declared age guidance, checked against self-declared birth date.",
          Group = "Audience",
          SortOrder = 1,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("688f50d2-0c1d-4e22-aad4-45d01c54b35e"),
          Name = "AgeTo",
          NameDisplay = "Maximum Age",
          Description = "Inclusive declared age guidance, checked against self-declared birth date.",
          Group = "Audience",
          SortOrder = 2,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("ac382b50-7b1b-48d0-8c12-7e7c852bf074"),
          Name = "TargetedGroups.Name",
          NameDisplay = "Targeted Groups",
          Description = "Informational programme audience; not a claim about the youth's identity.",
          Group = "Audience",
          SortOrder = 3,
          System = false,
          Required = false
        },
        new()
        {
          Id = new Guid("f3608301-3340-4d99-83a4-3ba3ce766a84"),
          Name = "SustainableDevelopmentGoals.Name",
          NameDisplay = "Sustainable Development Goals",
          Description = "Declared programme SDGs; not a measured individual impact outcome.",
          Group = "Impact",
          SortOrder = 1,
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
