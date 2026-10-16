using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Moq;
using Newtonsoft.Json;
using System.Reflection;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Extensions;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.MyOpportunity.Services;
using Yoma.Core.Domain.MyOpportunity.Validators;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Migrations;
using Yoma.Core.Infrastructure.Database.MyOpportunity.Repositories;

namespace Yoma.Core.Test.Core
{
  public class MyOpportunityCompletionLocationTests
  {
    #region Class Variables
    private static readonly Guid ProfileCountryId = new("359b0b97-e48d-42ee-8b84-c966bb046f77");
    private static readonly Guid PartnerCountryId = new("6395f3d1-53be-4118-9cb2-a213eb90c0a7");
    private static readonly MethodInfo ApplyLocation = typeof(MyOpportunityService).GetMethod(
      "PerformActionSendForVerificationApplyCompletionLocation", BindingFlags.Static | BindingFlags.NonPublic)!;
    #endregion Class Variables

    #region Tests
    [Theory]
    [InlineData(false, false, false)]
    [InlineData(true, false, false)]
    [InlineData(false, true, false)]
    [InlineData(false, false, true)]
    public void ManualCsvActionLinkAndPartnerFallbackUseProfile(bool imported, bool instant, bool partner)
    {
      var options = new MyOpportunityVerificationOptions
      {
        ImportedVerification = imported,
        InstantVerification = instant,
        PartnerSyncedVerification = partner
      };

      foreach (var type in Enum.GetValues<Domain.Opportunity.Type>().Where(type => type != Domain.Opportunity.Type.Entrepreneurship))
        foreach (var engagement in new[] { EngagementTypeOption.OnSite, EngagementTypeOption.Hybrid })
        {
          var opportunity = Opportunity(engagement);
          opportunity.Type = type;
          var result = Capture(Profile(), opportunity, options, request: new());
          Assert.Equal(ProfileCountryId, result.CountryId);
          Assert.Equal("South Africa", result.Country);
          Assert.Equal("Western Cape", result.Region);
          Assert.Equal("Cape Town", result.City);
        }
    }

    [Theory]
    [InlineData(EngagementTypeOption.Remote)]
    [InlineData(null)]
    public void RemoteAndUnknownEngagementNeverCaptureLocationEvenFromPartner(EngagementTypeOption? engagement)
    {
      var result = Capture(Profile(), Opportunity(engagement), PartnerOptions());
      AssertNoLocation(result);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void WorldwideIncludingLegacyMixedListsUsesProfileNotPartner(bool mixed)
    {
      var opportunity = Opportunity(EngagementTypeOption.Hybrid);
      opportunity.Countries = [new() { CodeAlpha2 = "WW", Name = "Worldwide" }];
      if (mixed) opportunity.Countries.Add(new() { Id = PartnerCountryId, CodeAlpha2 = "KE", Name = "Kenya" });

      var result = Capture(Profile(), opportunity, PartnerOptions());
      Assert.Equal(ProfileCountryId, result.CountryId);
      Assert.Equal("Cape Town, Western Cape, South Africa", result.Location);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void MissingProfileCountryDoesNotCaptureOrphanRegionCity(bool worldwide)
    {
      var profile = Profile();
      profile.CountryId = null;
      var opportunity = Opportunity(EngagementTypeOption.OnSite);
      if (worldwide) opportunity.Countries = [new() { CodeAlpha2 = "WW" }];

      AssertNoLocation(Capture(profile, opportunity, new()));
    }

    [Fact]
    public void PartialPartnerLocationWinsWithoutMixingProfileOrCheckingAvailability()
    {
      var result = Capture(Profile(), Opportunity(EngagementTypeOption.OnSite), PartnerOptions());
      Assert.Equal(PartnerCountryId, result.CountryId);
      Assert.Equal("Kenya", result.Country);
      Assert.Null(result.Region);
      Assert.Null(result.City);
      Assert.Equal("Kenya", result.Location);

      result = Capture(Profile(), Opportunity(EngagementTypeOption.Hybrid), PartnerOptions(), request: new()
      {
        CountryId = PartnerCountryId,
        Region = "Nairobi County",
        City = "Nairobi"
      });
      Assert.Equal("Nairobi, Nairobi County, Kenya", result.Location);
    }

    [Fact]
    public void CsvExplicitCountryDoesNotBorrowProfileRegionOrCity()
    {
      var result = Capture(Profile(), Opportunity(EngagementTypeOption.OnSite), new()
      {
        ImportedVerification = true
      }, request: new() { CountryId = PartnerCountryId });
      Assert.Equal(PartnerCountryId, result.CountryId);
      Assert.Null(result.Region);
      Assert.Null(result.City);
    }

    [Theory]
    [InlineData(Domain.MyOpportunity.VerificationStatus.Pending)]
    [InlineData(Domain.MyOpportunity.VerificationStatus.Completed)]
    public void ExistingSubmissionsPreserveSnapshotAndHistoricalNulls(Domain.MyOpportunity.VerificationStatus status)
    {
      foreach (var populated in new[] { false, true })
      {
        var existing = new Domain.MyOpportunity.Models.MyOpportunity
        {
          Id = Guid.NewGuid(),
          VerificationStatus = status,
          CountryId = populated ? PartnerCountryId : null,
          Country = populated ? "Kenya" : null,
          City = populated ? "Nairobi" : null
        };
        Capture(Profile(), Opportunity(EngagementTypeOption.Remote), new(), existing);
        Assert.Equal(populated ? PartnerCountryId : null, existing.CountryId);
        Assert.Equal(populated ? "Nairobi" : null, existing.City);
      }
    }

    [Theory]
    [InlineData(EngagementTypeOption.OnSite)]
    [InlineData(EngagementTypeOption.Remote)]
    public void RejectedResubmissionCapturesNewAttemptAndClearsStaleDetails(EngagementTypeOption engagement)
    {
      var existing = new Domain.MyOpportunity.Models.MyOpportunity
      {
        Id = Guid.NewGuid(),
        VerificationStatus = Domain.MyOpportunity.VerificationStatus.Rejected,
        CountryId = PartnerCountryId,
        Country = "Kenya",
        City = "Nairobi"
      };
      Capture(Profile(), Opportunity(engagement), new(), existing);
      if (engagement == EngagementTypeOption.OnSite)
        Assert.Equal("Cape Town, Western Cape, South Africa", existing.Location);
      else AssertNoLocation(existing);
    }

    [Fact]
    public void UnsupportedEngagementFailsExplicitly()
    {
      var exception = Assert.Throws<TargetInvocationException>(() => Capture(Profile(), Opportunity((EngagementTypeOption)999), new()));
      Assert.IsType<NotSupportedException>(exception.InnerException);
    }

    [Fact]
    public void UnsupportedOpportunityTypeFailsExplicitly()
    {
      var opportunity = Opportunity(EngagementTypeOption.OnSite);
      opportunity.Type = (Domain.Opportunity.Type)999;
      var exception = Assert.Throws<TargetInvocationException>(() => Capture(Profile(), opportunity, new()));
      Assert.IsType<NotSupportedException>(exception.InnerException);
    }

    [Fact]
    public void CsvIsCountryOnlyAndPartnerHashIncludesLocation()
    {
      Assert.NotNull(typeof(MyOpportunityInfoCsvImport).GetProperty("Country"));
      Assert.NotNull(typeof(MyOpportunityInfoCsvImport).GetProperty("CountryCompleted"));
      foreach (var property in new[] { "CountryId", "Region", "City" })
        Assert.Null(typeof(MyOpportunityInfoCsvImport).GetProperty(property));

      var request = new MyOpportunityRequestVerifyImportPartnerSync { OpportunityId = Guid.NewGuid(), UserId = Guid.NewGuid() };
      var hash = HashHelper.ComputeSHA256Hash(request);
      request.CountryId = PartnerCountryId;
      var countryHash = HashHelper.ComputeSHA256Hash(request);
      Assert.NotEqual(hash, countryHash);
      request.Region = "Nairobi County";
      var regionHash = HashHelper.ComputeSHA256Hash(request);
      Assert.NotEqual(countryHash, regionHash);
      request.City = "Nairobi";
      Assert.NotEqual(regionHash, HashHelper.ComputeSHA256Hash(request));
    }

    [Theory]
    [InlineData(EngagementTypeOption.OnSite)]
    [InlineData(EngagementTypeOption.Hybrid)]
    [InlineData(EngagementTypeOption.Remote)]
    [InlineData(null)]
    public void BusinessLocationIsExplicitAndIndependentOfEngagementAndWorldwide(EngagementTypeOption? engagement)
    {
      var opportunity = Opportunity(engagement);
      opportunity.Type = Domain.Opportunity.Type.Entrepreneurship;
      opportunity.Countries = [new() { CodeAlpha2 = "WW", Name = "Worldwide" }];
      AssertNoLocation(Capture(Profile(), opportunity, new()));
      AssertNoLocation(Capture(Profile(), opportunity, new() { ImportedVerification = true }));
      AssertNoLocation(Capture(Profile(), opportunity, new() { InstantVerification = true }));

      foreach (var options in new MyOpportunityVerificationOptions[]
      {
        new(), new() { ImportedVerification = true }, PartnerOptions()
      })
      {
        var result = Capture(Profile(), opportunity, options, request: new()
        {
          CountryId = PartnerCountryId,
          Region = "Nairobi County",
          City = "Nairobi"
        });
        Assert.Equal("Nairobi, Nairobi County, Kenya", result.Location);
        Assert.Null(typeof(Domain.MyOpportunity.Models.MyOpportunity).GetProperty("BusinessLocation"));
      }

      AssertNoLocation(Capture(Profile(), opportunity, new() { InstantVerification = true },
        request: new() { CountryId = PartnerCountryId }));
    }

    [Fact]
    public void ManualBusinessLocationIsOptionalButSuppliedValuesMustBeConsistent()
    {
      var countries = new Mock<ICountryService>();
      countries.Setup(service => service.GetByIdOrNull(PartnerCountryId))
        .Returns(new Domain.Lookups.Models.Country { Id = PartnerCountryId, CodeAlpha2 = "KE", Name = "Kenya" });
      var worldwideId = Guid.NewGuid();
      countries.Setup(service => service.GetByIdOrNull(worldwideId))
        .Returns(new Domain.Lookups.Models.Country { Id = worldwideId, CodeAlpha2 = "WW", Name = "Worldwide" });
      var validator = new MyOpportunityRequestValidatorVerify(Mock.Of<ITimeIntervalService>(), countries.Object);
      var request = new MyOpportunityRequestVerify { DateEnd = DateTimeOffset.UtcNow };
      var context = new ValidationContext<MyOpportunityRequestVerify>(request);
      ValidationContext<MyOpportunityRequestVerify> CreateContext()
      {
        var result = new ValidationContext<MyOpportunityRequestVerify>(request);
        foreach (var pair in context.RootContextData)
          result.RootContextData[pair.Key] = pair.Value;
        return result;
      }

      context.RootContextData[nameof(Domain.Opportunity.Models.Opportunity.Type)] = Domain.Opportunity.Type.Entrepreneurship;
      Assert.True(validator.Validate(CreateContext()).IsValid);

      request.City = "Nairobi";
      Assert.Contains(validator.Validate(CreateContext()).Errors, error => error.PropertyName == nameof(request.CountryId));
      request.CountryId = PartnerCountryId;
      Assert.True(validator.Validate(CreateContext()).IsValid);
      request.Region = new string('r', Constants.Region_MaxLength + 1);
      Assert.Contains(validator.Validate(CreateContext()).Errors, error => error.PropertyName == nameof(request.Region));
      request.Region = null;
      foreach (var invalid in new[] { worldwideId, Guid.Empty, Guid.NewGuid() })
      {
        request.CountryId = invalid;
        Assert.Contains(validator.Validate(CreateContext()).Errors, error => error.PropertyName == nameof(request.CountryId));
      }

      request.CountryId = PartnerCountryId;
      context.RootContextData[nameof(Domain.Opportunity.Models.Opportunity.Type)] = Domain.Opportunity.Type.Job;
      Assert.True(validator.Validate(CreateContext()).IsValid);
      var opportunity = Opportunity(EngagementTypeOption.OnSite);
      opportunity.Type = Domain.Opportunity.Type.Job;
      var exception = Assert.Throws<TargetInvocationException>(() => Capture(Profile(), opportunity, new(), request: request));
      Assert.IsType<ValidationException>(exception.InnerException);
      context.RootContextData[nameof(MyOpportunityVerificationOptions.AutoFinalizedVerification)] = true;
      Assert.True(validator.Validate(CreateContext()).IsValid);
    }

    [Fact]
    public void PartnerValidatorAllowsMissingAndPartialLocationsButRejectsInvalidData()
    {
      var countries = new Mock<ICountryService>();
      countries.Setup(service => service.GetByIdOrNull(PartnerCountryId))
        .Returns(new Domain.Lookups.Models.Country { Id = PartnerCountryId, CodeAlpha2 = "KE", Name = "Kenya" });
      var worldwideId = Guid.NewGuid();
      countries.Setup(service => service.GetByIdOrNull(worldwideId))
        .Returns(new Domain.Lookups.Models.Country { Id = worldwideId, CodeAlpha2 = "WW", Name = "Worldwide" });
      var validator = new MyOpportunityRequestValidatorVerifyImportPartnerSync(countries.Object);
      var request = new MyOpportunityRequestVerifyImportPartnerSync { OpportunityId = Guid.NewGuid(), UserId = Guid.NewGuid() };
      Assert.True(validator.Validate(request).IsValid);

      request.City = "Nairobi";
      Assert.Contains(validator.Validate(request).Errors, error => error.PropertyName == nameof(request.CountryId));
      request.CountryId = PartnerCountryId;
      Assert.True(validator.Validate(request).IsValid);
      request.Region = new string('r', Constants.Region_MaxLength + 1);
      request.City = new string('c', Constants.City_MaxLength + 1);
      var errors = validator.Validate(request).Errors;
      Assert.Contains(errors, error => error.PropertyName == nameof(request.Region));
      Assert.Contains(errors, error => error.PropertyName == nameof(request.City));
      request.Region = null;
      request.City = null;
      foreach (var invalid in new[] { worldwideId, Guid.Empty, Guid.NewGuid() })
      {
        request.CountryId = invalid;
        Assert.Contains(validator.Validate(request).Errors, error => error.PropertyName == nameof(request.CountryId));
      }
    }

    [Fact]
    public void ResponseAndCredentialProjectionUseSnapshotAndDoNotExposeCalculatedClaim()
    {
      var result = Capture(Profile(), Opportunity(EngagementTypeOption.OnSite), new());
      var info = result.ToInfo();
      Assert.Equal(ProfileCountryId, info.CountryId);
      Assert.Equal(result.Country, info.Country);
      Assert.Equal(result.Region, info.Region);
      Assert.Equal(result.City, info.City);
      Assert.Null(info.Location);
      Assert.DoesNotContain(nameof(result.Location), JsonConvert.SerializeObject(result));
      result.City = "South Africa";
      result.Region = null;
      Assert.Equal("South Africa", result.Location);
      result.CountryId = null;
      Assert.Null(result.Location);
    }

    [Fact]
    public void MigrationAddsNullableSnapshotWithoutBackfillAndMatchesEfModel()
    {
      var operations = new ApplicationDb_CF_Configuration().UpOperations;
      var columns = operations.OfType<AddColumnOperation>().Where(operation => operation.Table == "MyOpportunity").ToList();
      Assert.Equal(3, columns.Count);
      Assert.All(columns, column =>
      {
        Assert.True(column.IsNullable);
        Assert.Null(column.DefaultValue);
        Assert.Null(column.DefaultValueSql);
      });
      Assert.Single(operations.OfType<AddForeignKeyOperation>(), operation => operation.Name == "FK_MyOpportunity_Country_CountryId");
      Assert.DoesNotContain(operations.OfType<SqlOperation>(), operation => operation.Sql.Contains("CountryId", StringComparison.Ordinal));

      using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql("Host=localhost;Database=unused_model_test", options => options.UseNetTopologySuite()).Options);
      Assert.False(context.Database.HasPendingModelChanges());
      var sql = new MyOpportunityRepository(context).Query().ToQueryString();
      Assert.Contains("CountryId", sql);
      Assert.Contains("Region", sql);
      Assert.Contains("City", sql);
    }
    #endregion Tests

    #region Private Members
    private static User Profile() => new()
    {
      CountryId = ProfileCountryId,
      Country = "South Africa",
      Region = "Western Cape",
      City = "Cape Town"
    };

    private static Domain.Opportunity.Models.Opportunity Opportunity(EngagementTypeOption? engagement) => new()
    {
      EngagementType = engagement,
      Countries = [new() { Id = ProfileCountryId, CodeAlpha2 = "ZA", Name = "South Africa", City = "Advertised City" }]
    };

    private static MyOpportunityVerificationOptions PartnerOptions() => new()
    {
      PartnerSyncedVerification = true
    };

    private static Domain.MyOpportunity.Models.MyOpportunity Capture(User user,
      Domain.Opportunity.Models.Opportunity opportunity,
      MyOpportunityVerificationOptions options,
      Domain.MyOpportunity.Models.MyOpportunity? existing = null,
      MyOpportunityRequestVerify? request = null)
    {
      var result = existing ?? new();
      result.OpportunityType = opportunity.Type;
      request ??= options.PartnerSyncedVerification ? new() { CountryId = PartnerCountryId } : new();
      var country = request.CountryId == PartnerCountryId
        ? new Domain.Lookups.Models.Country { Id = PartnerCountryId, CodeAlpha2 = "KE", Name = "Kenya" } : null;
      ApplyLocation.Invoke(null, [result, user, opportunity, request, options, country]);
      return result;
    }

    private static void AssertNoLocation(Domain.MyOpportunity.Models.MyOpportunity result)
    {
      Assert.Null(result.CountryId);
      Assert.Null(result.Country);
      Assert.Null(result.Region);
      Assert.Null(result.City);
      Assert.Null(result.Location);
    }
    #endregion Private Members
  }
}
