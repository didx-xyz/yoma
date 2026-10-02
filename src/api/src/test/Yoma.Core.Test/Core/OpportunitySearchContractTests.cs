using Microsoft.EntityFrameworkCore;
using Moq;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Globalization;
using System.Reflection;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Helpers;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Validators;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Opportunity.Repositories;

namespace Yoma.Core.Test.Core
{
  public class OpportunitySearchContractTests
  {
    #region Class Variables
    private static readonly Guid ActiveId = Guid.NewGuid();
    private static readonly Guid ExpiredId = Guid.NewGuid();
    private static readonly DateTimeOffset Now = new(2026, 10, 1, 12, 0, 0, TimeSpan.Zero);
    #endregion

    #region Public Members
    [Theory]
    [InlineData(UnspecifiedMatch.Exclude, 1)]
    [InlineData(UnspecifiedMatch.Include, 2)]
    [InlineData(UnspecifiedMatch.Only, 1)]
    public void FalseSelectionDoesNotTurnKnownTrueIntoUnknown(UnspecifiedMatch mode, int count)
    {
      var values = new List<Opportunity>
      {
        new() { Incentivized = false }, new() { Incentivized = true }, new() { Incentivized = null }
      };
      var predicate = SearchCriterionHelper.Apply<Opportunity>(o => o.Incentivized == false,
        o => !o.Incentivized.HasValue, mode).Compile();

      Assert.Equal(count, values.Count(predicate));
      Assert.DoesNotContain(values.Where(predicate), o => o.Incentivized == true);
    }

    [Theory]
    [InlineData("{\"incentivized\":{\"value\":false}}", true)]
    [InlineData("{\"provider\":{\"unspecified\":\"Only\"}}", true)]
    [InlineData("{\"provider\":{\"value\":\"X\",\"unspecified\":\"Only\"}}", false)]
    [InlineData("{\"provider\":{\"unspecified\":\"Include\"}}", false)]
    [InlineData("{\"provider\":{\"value\":\"X\",\"unspecified\":99}}", false)]
    [InlineData("{\"types\":{\"value\":[\"d74da423-7779-4f49-9d6b-92ce5f61f4a1\"],\"unspecified\":\"Exclude\"}}", false)]
    [InlineData("{\"groups\":[{\"anyOf\":[{\"provider\":{\"value\":\"X\"}},{\"incentivized\":{\"value\":false}}]}]}", true)]
    [InlineData("{\"groups\":[{\"anyOf\":[{}]}]}", false)]
    [InlineData("{\"groups\":[{\"anyOf\":[{\"zltoReward\":{\"value\":{\"hasReward\":false}}}]}]}", false)]
    [InlineData("{\"groups\":[{\"anyOf\":[{\"provider\":{\"value\":\"X\"},\"pageSize\":10}]}]}", false)]
    [InlineData("{\"groups\":[{\"anyOf\":[{\"provider\":{\"value\":\"X\"},\"groups\":[]}]}]}", false)]
    [InlineData("{\"anyOf\":[{\"provider\":{\"value\":\"X\"}}]}", false)]
    [InlineData("{\"groups\":[]}", false)]
    [InlineData("{\"groups\":[null]}", false)]
    [InlineData("{\"groups\":[{\"anyOf\":[null]}]}", false)]
    [InlineData("{\"countries\":[null]}", false)]
    [InlineData("{\"customFields\":[null]}", false)]
    [InlineData("{\"ordering\":[null]}", false)]
    [InlineData("{\"pageNumber\":2147483647,\"pageSize\":1000}", false)]
    [InlineData("{\"pageNumber\":2147484,\"pageSize\":1000}", true)]
    [InlineData("{\"ordering\":[{\"field\":\"DateEnd\",\"direction\":\"Ascending\"}]}", true)]
    [InlineData("{\"ordering\":[{\"field\":99,\"direction\":\"Ascending\"}]}", false)]
    [InlineData("{\"ordering\":[{\"field\":\"DateEnd\"},{\"field\":\"DateEnd\"}]}", false)]
    [InlineData("{\"customFields\":[{\"key\":\"jobSalaryMinimum\",\"unspecified\":\"Only\"}]}", true)]
    [InlineData("{\"customFields\":[{\"key\":\"jobSalaryMinimum\",\"operator\":99,\"value\":\"1\"}]}", false)]
    [InlineData("{\"customFields\":[{\"key\":\"jobSalaryMinimum\",\"operator\":\"Exists\",\"unspecified\":\"Include\"}]}", false)]
    public void WireContractValidatesRootAndBranches(string json, bool valid)
    {
      var filter = JsonConvert.DeserializeObject<OpportunitySearchFilterAdmin>(json)!;
      filter.TotalCountOnly = true;
      filter.SanitizeCollections();

      Assert.Equal(valid, CreateValidator().Validate(filter).IsValid);
    }

    [Fact]
    public void GroupLimitsAndSelectionNormalizationAreShared()
    {
      var filter = new OpportunitySearchFilterAdmin
      {
        TotalCountOnly = true,
        EngagementTypes = new() { Value = [] },
        Groups = [.. Enumerable.Range(0, OpportunitySearchConstants.Groups_MaxCount + 1).Select(_ => new OpportunitySearchGroup { AnyOf = [new() { Provider = new() { Value = "X" } }] })]
      };
      filter.SanitizeCollections();
      Assert.Null(filter.EngagementTypes);
      Assert.False(CreateValidator().Validate(filter).IsValid);

      filter.Groups = [new() { AnyOf = [.. Enumerable.Range(0, OpportunitySearchConstants.Branches_MaxCount + 1).Select(_ => new OpportunitySearchSelection { Provider = new() { Value = "X" } })] }];
      Assert.False(CreateValidator().Validate(filter).IsValid);
    }

    [Theory]
    [InlineData("ParseOpportunitySearchFilterCommitmentInterval", "{\"commitmentInterval\":{\"value\":{\"options\":[null]}}}")]
    [InlineData("ParseOpportunitySearchFilterCommitmentInterval", "{\"commitmentInterval\":{\"value\":{\"options\":[\"32768|00000000-0000-0000-0000-000000000001\"]}}}")]
    [InlineData("ParseOpportunitySearchFilterZltoReward", "{\"zltoReward\":{\"value\":{\"ranges\":[\"invalid\"]}}}")]
    [InlineData("ParseOpportunitySearchFilterZltoReward", "{\"zltoReward\":{\"value\":{\"ranges\":[null]}}}")]
    public void MalformedRangeSelectionsAreValidationFailures(string parser, string json)
    {
      var filter = JsonConvert.DeserializeObject<OpportunitySearchSelection>(json)!;
      var method = typeof(Domain.Opportunity.Services.OpportunityService)
        .GetMethod(parser, BindingFlags.Static | BindingFlags.NonPublic)!;

      var error = Assert.Throws<TargetInvocationException>(() => method.Invoke(null, [filter]));
      Assert.IsType<FluentValidation.ValidationException>(error.InnerException);
    }

    [Fact]
    public void RewardRangeParsingUsesInvariantNumbersRegardlessOfServerCulture()
    {
      var original = CultureInfo.CurrentCulture;
      try
      {
        CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("fr-FR");
        var filter = new OpportunitySearchSelection
        {
          ZltoReward = new() { Value = new() { Ranges = ["1.5|2.5"] } }
        };
        var method = typeof(Domain.Opportunity.Services.OpportunityService)
          .GetMethod("ParseOpportunitySearchFilterZltoReward", BindingFlags.Static | BindingFlags.NonPublic)!;
        method.Invoke(null, [filter]);

        var parsed = typeof(OpportunitySearchFilterZltoReward)
          .GetProperty("RangesParsed", BindingFlags.Instance | BindingFlags.NonPublic)!;
        var range = Assert.Single((List<OpportunitySearchFilterZltoRewardRange>)parsed.GetValue(filter.ZltoReward.Value)!);
        Assert.Equal(1.5m, range.From);
        Assert.Equal(2.5m, range.To);
      }
      finally
      {
        CultureInfo.CurrentCulture = original;
      }
    }

    [Fact]
    public void AdminCountOnlySkipsTreasuryAndEngagementHydration()
    {
      var filter = new OpportunitySearchFilterAdmin { TotalCountOnly = true };
      var opportunities = new Mock<Domain.Opportunity.Interfaces.IOpportunityService>(MockBehavior.Strict);
      opportunities.Setup(o => o.Search(filter, true)).Returns(new OpportunitySearchResults { TotalCount = 7 });
      var treasury = new Mock<Domain.Treasury.Interfaces.ITreasuryService>(MockBehavior.Strict);
      var engagements = new Mock<Domain.MyOpportunity.Interfaces.IMyOpportunityService>(MockBehavior.Strict);
      var service = new Domain.Opportunity.Services.OpportunityInfoService(
        Options.Create(new AppSettings()), new HttpContextAccessor(), opportunities.Object,
        engagements.Object, Mock.Of<Domain.ActionLink.Interfaces.ILinkService>(),
        Mock.Of<Domain.Entity.Interfaces.IUserService>(), Mock.Of<Domain.Core.Interfaces.IDownloadService>(),
        treasury.Object);

      var result = service.Search(filter, true);

      Assert.Equal(7, result.TotalCount);
      Assert.Null(result.Items);
      treasury.VerifyNoOtherCalls();
      engagements.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(-1, PublishedState.Expired)]
    [InlineData(0, PublishedState.Active)]
    [InlineData(1, PublishedState.Active)]
    public void PublishedStateUsesTheEndDateEvenBeforeExpiryJobRuns(int seconds, PublishedState expected)
    {
      var opportunity = new Opportunity { StatusId = ActiveId, DateStart = Now.AddDays(-1), DateEnd = Now.AddSeconds(seconds) };
      foreach (var state in Enum.GetValues<PublishedState>())
      {
        var predicate = OpportunityPublishedStateHelper.Predicate<Opportunity>([state],
          o => o.StatusId, o => o.DateStart, o => o.DateEnd, ActiveId, ExpiredId, Now).Compile();
        Assert.Equal(state == expected, predicate(opportunity));
      }
    }

    [Fact]
    public void EquivalentGroupsNormalizeToTheSameHashInput()
    {
      var first = new OpportunitySearchFilterAdmin
      {
        Groups =
        [
          new() { AnyOf = [new() { Provider = new() { Value = "A" } }, new() { Provider = new() { Value = "B" } }] },
          new() { AnyOf = [new() { Age = 18 }] }
        ],
        CustomFields = [new() { Key = "jobSalaryMinimum", Unspecified = UnspecifiedMatch.Only }]
      };
      var second = new OpportunitySearchFilterAdmin
      {
        Groups =
        [
          new() { AnyOf = [new() { Age = 18 }] },
          new() { AnyOf = [new() { Provider = new() { Value = "B" } }, new() { Provider = new() { Value = "A" } }] }
        ],
        CustomFields = [new() { Key = "jobSalaryMinimum", Unspecified = UnspecifiedMatch.Only }]
      };

      first.NormalizeForHashing();
      second.NormalizeForHashing();

      Assert.Equal(JsonConvert.SerializeObject(first), JsonConvert.SerializeObject(second));
    }

    [Theory]
    [InlineData("{\"provider\":{\"value\":\"A\",\"unspecified\":\"Exclude\"}}", "{\"provider\":{\"value\":\"A\",\"unspecified\":\"Include\"}}")]
    [InlineData("{\"groups\":[{\"anyOf\":[{\"age\":18}]}]}", "{\"groups\":[{\"anyOf\":[{\"age\":19}]}]}")]
    [InlineData("{\"ordering\":[{\"field\":\"DateEnd\",\"direction\":\"Ascending\"}]}", "{\"ordering\":[{\"field\":\"DateEnd\",\"direction\":\"Descending\"}]}")]
    [InlineData("{\"totalCountOnly\":false}", "{\"totalCountOnly\":true}")]
    [InlineData("{\"customFields\":[{\"key\":\"jobSalaryMinimum\",\"operator\":\"Equals\",\"value\":\"1\"}]}", "{\"customFields\":[{\"key\":\"jobSalaryMinimum\",\"operator\":\"Equals\",\"value\":\"2\"}]}")]
    public void DifferentSearchSemanticsRemainDistinctForHashing(string firstJson, string secondJson)
    {
      var first = JsonConvert.DeserializeObject<OpportunitySearchFilterAdmin>(firstJson)!;
      var second = JsonConvert.DeserializeObject<OpportunitySearchFilterAdmin>(secondJson)!;
      first.NormalizeForHashing();
      second.NormalizeForHashing();

      Assert.NotEqual(JsonConvert.SerializeObject(first), JsonConvert.SerializeObject(second));
    }

    [Fact]
    public void CFApplicabilityAndUnknownModesRemainSqlPredicates()
    {
      using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql("Host=localhost;Database=not_connected", o => o.UseNetTopologySuite()).Options);
      var repository = new OpportunityRepository(context);
      var filter = new CustomFieldFilter
      {
        Key = "jobSalaryMinimum",
        CustomFieldDefinitionId = Guid.NewGuid(),
        AppliesToTypeId = Guid.NewGuid(),
        Unspecified = UnspecifiedMatch.Only
      };
      var sql = repository.WhereCustomFields(repository.Query(false), [filter]).Select(o => o.Id).ToQueryString();

      Assert.Contains("CustomFieldValue", sql);
      Assert.Contains("NOT", sql);
      Assert.Contains("TypeId", sql);
      Assert.Contains(" OR ", sql);
    }

    [Fact]
    public void ContainsEscapesLiteralWildcardCharactersInSql()
    {
      using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql("Host=localhost;Database=not_connected", o => o.UseNetTopologySuite()).Options);
      var repository = new OpportunityCountryRepository(context);
      var sql = repository.Query().Where(repository.Contains(o => o.City, "Cape_%")).Select(o => o.Id).ToQueryString();
      Assert.Contains("ILIKE", sql);
      Assert.Contains("ESCAPE", sql);
      Assert.Contains("Cape\\_\\%", sql);
    }
    #endregion

    #region Private Members
    private static OpportunitySearchFilterValidator CreateValidator()
    {
      return new(new OpportunitySearchSelectionValidator(new CoordinatesValidator(),
        Mock.Of<ICountryService>(), Mock.Of<IAccessibilityService>(), new CustomFieldFilterValidator()));
    }
    #endregion
  }
}
