using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.LaborMarketProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Lookups.Services;
using Yoma.Core.Domain.Lookups.Validators;

namespace Yoma.Core.Test.Lookups
{
  public class SkillServiceTests
  {
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void ExactNamesWinAndUnsafeParentheticalAliasesAreIgnored(bool cached)
    {
      using var fixture = new Fixture(cached, "Geospatial Information Technology (GIT)",
        "ActiveXObject (JavaScript)", "Framing (HTML)", "DataCapture (SQL)", "Git", "JavaScript");

      Assert.Equal("Git", fixture.Service.GetByNameNormalizedOrNull(" GIT ")?.Name);
      Assert.Equal("JavaScript", fixture.Service.GetByNameNormalizedOrNull("javascript")?.Name);
      Assert.Null(fixture.Service.GetByNameNormalizedOrNull("HTML"));
      Assert.Null(fixture.Service.GetByNameNormalizedOrNull("SQL"));
      Assert.Equal("Framing (HTML)", fixture.Service.GetByNameNormalizedOrNull("Framing (HTML)")?.Name);
      // Exercise the same lookup again after it has been cached.
      Assert.Equal("Git", fixture.Service.GetByNameNormalizedOrNull("git")?.Name);
    }

    [Theory]
    [InlineData("Git", "Geospatial Information Technology (GIT)")]
    [InlineData("JavaScript", "ActiveXObject (JavaScript)")]
    [InlineData("Python", "Python 3")]
    [InlineData("Python 2", "Python 3")]
    [InlineData("Python (Snake)", "Python (Programming Language)")]
    public void DoesNotInferUnrelatedSkills(string input, string name)
    {
      using var fixture = new Fixture(true, name);
      Assert.Null(fixture.Service.GetByNameNormalizedOrNull(input));
    }

    [Theory]
    [InlineData("Python", "Python (Programming Language)")]
    [InlineData("community-outreach", "Community Outreach")]
    [InlineData("CommunityOutreach", "Community Outreach")]
    [InlineData("Research &amp; Development", "Research and Development")]
    [InlineData("Research Development", "Research and Development")]
    [InlineData("C sharp", "C#")]
    [InlineData("C plus plus", "C++")]
    public void PreservesUnambiguousFormattingAndBaseNameMatches(string input, string name)
    {
      using var fixture = new Fixture(true, name);
      Assert.Equal(name, fixture.Service.GetByNameNormalizedOrNull(input)?.Name);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void AmbiguousAliasesNeverPickTheFirstSkill(bool cached)
    {
      using var fixture = new Fixture(cached, "Python (Programming Language)", "Python (Snake)",
        "A B C", "AB C", "Research and Development", "Research Development");

      Assert.Null(fixture.Service.GetByNameNormalizedOrNull("Python"));
      Assert.Null(fixture.Service.GetByNameNormalizedOrNull("A BC"));
      Assert.Equal("AB C", fixture.Service.GetByNameNormalizedOrNull("AB C")?.Name);
      Assert.Equal("Research and Development",
        fixture.Service.GetByNameNormalizedOrNull("Research & Development")?.Name);
      Assert.Equal("Research Development",
        fixture.Service.GetByNameNormalizedOrNull("Research Development")?.Name);
    }

    [Fact]
    public void NormalizedFullNameCollisionsAreNotResolvedByOrder()
    {
      using var fixture = new Fixture(true, "Data-Analysis", "Data Analysis");
      Assert.Null(fixture.Service.GetByNameNormalizedOrNull("Data_Analysis"));
      Assert.Equal("Data-Analysis", fixture.Service.GetByNameNormalizedOrNull("Data-Analysis")?.Name);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public void EmptyNamesRemainInvalid(string? input)
    {
      using var fixture = new Fixture(false, "Python");
      Assert.Throws<ArgumentNullException>(() => fixture.Service.GetByNameNormalizedOrNull(input!));
    }

    private sealed class Fixture : IDisposable
    {
      private readonly MemoryCache _cache = new(new MemoryCacheOptions());
      public SkillService Service { get; }

      public Fixture(bool cached, params string[] names)
      {
        var skills = names.Select(name => new Skill { Id = Guid.NewGuid(), Name = name }).ToList();
        var repository = new Mock<IRepositoryBatchedValueContains<Skill>>();
        repository.Setup(o => o.Query()).Returns(skills.AsQueryable());
        var factory = new Mock<ILaborMarketProviderClientFactory>();
        factory.Setup(o => o.CreateClient()).Returns(Mock.Of<ILaborMarketProviderClient>());
        Service = new SkillService(NullLogger<SkillService>.Instance,
          Options.Create(new AppSettings
          {
            CacheEnabledByCacheItemTypes = cached ? "Lookups" : "",
            CacheSlidingExpirationInHours = 1,
            CacheAbsoluteExpirationRelativeToNowInDays = 1
          }), Options.Create(new ScheduleJobOptions()), _cache, factory.Object,
          new SkillSearchFilterValidator(), repository.Object, Mock.Of<IDistributedLockService>());
      }

      public void Dispose() => _cache.Dispose();
    }
  }
}
