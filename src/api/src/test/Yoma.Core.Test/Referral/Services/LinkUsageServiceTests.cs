using FluentValidation;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Test.Referral.Builders;
using Yoma.Core.Test.Referral.Fixtures;

namespace Yoma.Core.Test.Referral.Services
{
  public class LinkUsageServiceTests
  {
    #region Constants
    private const string RefereeUsername = "referee@example.com";
    #endregion

    #region ClaimAsReferee

    [Trait("Category", "Referral")]
    [Fact]
    public async Task ClaimAsReferee_HappyPath_CreatesPendingUsage()
    {
      // Arrange
      var fixture = new LinkUsageServiceFixture(RefereeUsername);

      var userId = Guid.NewGuid();
      var referrerUserId = Guid.NewGuid();
      var programId = Guid.NewGuid();
      var linkId = Guid.NewGuid();

      var user = new UserBuilder()
        .WithId(userId)
        .WithUsername(RefereeUsername)
        .Build();

      var program = new ProgramBuilder()
        .WithId(programId)
        .WithStatus(ProgramStatus.Active)
        .WithDateStart(DateTimeOffset.UtcNow.AddDays(-7))
        .Build();

      var link = new ReferralLinkBuilder()
        .WithId(linkId)
        .WithProgramId(programId)
        .WithUserId(referrerUserId)
        .WithStatus(ReferralLinkStatus.Active)
        .Build();

      SetupUserService(fixture, RefereeUsername, user);
      SetupLinkService(fixture, linkId, link);
      SetupProgramService(fixture, programId, program);
      SetupCountryWorldwide(fixture);
      SetupEmptyUsageRepository(fixture);

      var sut = fixture.Build();

      // Act
      await sut.ClaimAsReferee(linkId);

      // Assert
      fixture.LinkUsageRepository.Verify(
        r => r.Create(It.Is<ReferralLinkUsage>(u =>
          u.ProgramId == programId &&
          u.LinkId == linkId &&
          u.UserId == userId &&
          u.Status == ReferralLinkUsageStatus.Pending)),
        Times.Once);
    }

    [Trait("Category", "Referral")]
    [Fact]
    public async Task ClaimAsReferee_SelfReferral_ThrowsValidationException()
    {
      // Arrange
      var fixture = new LinkUsageServiceFixture(RefereeUsername);

      var userId = Guid.NewGuid();
      var programId = Guid.NewGuid();
      var linkId = Guid.NewGuid();

      var user = new UserBuilder()
        .WithId(userId)
        .WithUsername(RefereeUsername)
        .Build();

      // Link owned by the same user (self-referral)
      var link = new ReferralLinkBuilder()
        .WithId(linkId)
        .WithProgramId(programId)
        .WithUserId(userId)
        .WithStatus(ReferralLinkStatus.Active)
        .Build();

      var program = new ProgramBuilder()
        .WithId(programId)
        .WithStatus(ProgramStatus.Active)
        .Build();

      SetupUserService(fixture, RefereeUsername, user);
      SetupLinkService(fixture, linkId, link);
      SetupProgramService(fixture, programId, program);

      var sut = fixture.Build();

      // Act & Assert
      var ex = await Assert.ThrowsAsync<ValidationException>(() => sut.ClaimAsReferee(linkId));
      Assert.Contains("cannot claim your own referral link", ex.Message);
    }

    [Trait("Category", "Referral")]
    [Fact]
    public async Task ClaimAsReferee_UserNotOnboarded_ThrowsValidationException()
    {
      // Arrange
      var fixture = new LinkUsageServiceFixture(RefereeUsername);

      var userId = Guid.NewGuid();
      var referrerUserId = Guid.NewGuid();
      var programId = Guid.NewGuid();
      var linkId = Guid.NewGuid();

      var user = new UserBuilder()
        .WithId(userId)
        .WithUsername(RefereeUsername)
        .NotOnboarded()
        .Build();

      var link = new ReferralLinkBuilder()
        .WithId(linkId)
        .WithProgramId(programId)
        .WithUserId(referrerUserId)
        .WithStatus(ReferralLinkStatus.Active)
        .Build();

      var program = new ProgramBuilder()
        .WithId(programId)
        .WithStatus(ProgramStatus.Active)
        .Build();

      SetupUserService(fixture, RefereeUsername, user);
      SetupLinkService(fixture, linkId, link);
      SetupProgramService(fixture, programId, program);

      var sut = fixture.Build();

      // Act & Assert
      var ex = await Assert.ThrowsAsync<ValidationException>(() => sut.ClaimAsReferee(linkId));
      Assert.Contains("must complete your profile", ex.Message);
    }

    [Trait("Category", "Referral")]
    [Fact]
    public async Task ClaimAsReferee_AlreadyClaimedSameProgram_Pending_ThrowsValidationException()
    {
      // Arrange
      var fixture = new LinkUsageServiceFixture(RefereeUsername);

      var userId = Guid.NewGuid();
      var referrerUserId = Guid.NewGuid();
      var programId = Guid.NewGuid();
      var linkId = Guid.NewGuid();

      var user = new UserBuilder()
        .WithId(userId)
        .WithUsername(RefereeUsername)
        .Build();

      var program = new ProgramBuilder()
        .WithId(programId)
        .WithName("Test Program")
        .WithStatus(ProgramStatus.Active)
        .WithDateStart(DateTimeOffset.UtcNow.AddDays(-7))
        .Build();

      var link = new ReferralLinkBuilder()
        .WithId(linkId)
        .WithProgramId(programId)
        .WithUserId(referrerUserId)
        .WithStatus(ReferralLinkStatus.Active)
        .Build();

      // Existing pending usage for this user on this program
      var existingUsage = new ReferralLinkUsageBuilder()
        .WithUserId(userId)
        .WithProgramId(programId)
        .WithLinkId(linkId)
        .WithStatus(ReferralLinkUsageStatus.Pending)
        .WithDateClaimed(DateTimeOffset.UtcNow.AddDays(-1))
        .Build();

      SetupUserService(fixture, RefereeUsername, user);
      SetupLinkService(fixture, linkId, link);
      SetupProgramService(fixture, programId, program);
      SetupCountryWorldwide(fixture);

      var usages = new List<ReferralLinkUsage> { existingUsage }.AsQueryable();
      fixture.LinkUsageRepository.Setup(r => r.Query()).Returns(usages);
      fixture.LinkUsageRepository.Setup(r => r.Query(It.IsAny<LockMode>())).Returns(usages);

      var sut = fixture.Build();

      // Act & Assert
      var ex = await Assert.ThrowsAsync<ValidationException>(() => sut.ClaimAsReferee(linkId));
      Assert.Contains("pending", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Trait("Category", "Referral")]
    [Fact]
    public async Task ClaimAsReferee_AlreadyClaimedSameProgram_Completed_ThrowsValidationException()
    {
      // Arrange
      var fixture = new LinkUsageServiceFixture(RefereeUsername);

      var userId = Guid.NewGuid();
      var referrerUserId = Guid.NewGuid();
      var programId = Guid.NewGuid();
      var linkId = Guid.NewGuid();

      var user = new UserBuilder()
        .WithId(userId)
        .WithUsername(RefereeUsername)
        .Build();

      var program = new ProgramBuilder()
        .WithId(programId)
        .WithName("Test Program")
        .WithStatus(ProgramStatus.Active)
        .WithDateStart(DateTimeOffset.UtcNow.AddDays(-7))
        .Build();

      var link = new ReferralLinkBuilder()
        .WithId(linkId)
        .WithProgramId(programId)
        .WithUserId(referrerUserId)
        .WithStatus(ReferralLinkStatus.Active)
        .Build();

      // Existing completed usage for this user on this program
      var existingUsage = new ReferralLinkUsageBuilder()
        .WithUserId(userId)
        .WithProgramId(programId)
        .WithLinkId(linkId)
        .WithStatus(ReferralLinkUsageStatus.Completed)
        .WithDateClaimed(DateTimeOffset.UtcNow.AddDays(-5))
        .Build();

      SetupUserService(fixture, RefereeUsername, user);
      SetupLinkService(fixture, linkId, link);
      SetupProgramService(fixture, programId, program);
      SetupCountryWorldwide(fixture);

      var usages = new List<ReferralLinkUsage> { existingUsage }.AsQueryable();
      fixture.LinkUsageRepository.Setup(r => r.Query()).Returns(usages);
      fixture.LinkUsageRepository.Setup(r => r.Query(It.IsAny<LockMode>())).Returns(usages);

      var sut = fixture.Build();

      // Act & Assert
      var ex = await Assert.ThrowsAsync<ValidationException>(() => sut.ClaimAsReferee(linkId));
      Assert.Contains("already completed", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Trait("Category", "Referral")]
    [Fact]
    public async Task ClaimAsReferee_ProgramNotActive_ThrowsValidationException()
    {
      // Arrange
      var fixture = new LinkUsageServiceFixture(RefereeUsername);

      var userId = Guid.NewGuid();
      var referrerUserId = Guid.NewGuid();
      var programId = Guid.NewGuid();
      var linkId = Guid.NewGuid();

      var user = new UserBuilder()
        .WithId(userId)
        .WithUsername(RefereeUsername)
        .Build();

      var program = new ProgramBuilder()
        .WithId(programId)
        .WithName("Test Program")
        .WithStatus(ProgramStatus.Inactive)
        .WithDateStart(DateTimeOffset.UtcNow.AddDays(-7))
        .Build();

      var link = new ReferralLinkBuilder()
        .WithId(linkId)
        .WithProgramId(programId)
        .WithUserId(referrerUserId)
        .WithStatus(ReferralLinkStatus.Active)
        .Build();

      SetupUserService(fixture, RefereeUsername, user);
      SetupLinkService(fixture, linkId, link);
      SetupProgramService(fixture, programId, program);
      SetupCountryWorldwide(fixture);
      SetupEmptyUsageRepository(fixture);

      var sut = fixture.Build();

      // Act & Assert
      var ex = await Assert.ThrowsAsync<ValidationException>(() => sut.ClaimAsReferee(linkId));
      Assert.Contains("status is 'Inactive'", ex.Message);
    }

    [Trait("Category", "Referral")]
    [Fact]
    public async Task ClaimAsReferee_ProgramCapReached_ThrowsValidationException()
    {
      // Arrange
      var fixture = new LinkUsageServiceFixture(RefereeUsername);

      var userId = Guid.NewGuid();
      var referrerUserId = Guid.NewGuid();
      var programId = Guid.NewGuid();
      var linkId = Guid.NewGuid();

      var user = new UserBuilder()
        .WithId(userId)
        .WithUsername(RefereeUsername)
        .Build();

      // Program with completion limit reached (CompletionBalance = limit - total = 10 - 10 = 0)
      var program = new ProgramBuilder()
        .WithId(programId)
        .WithName("Test Program")
        .WithStatus(ProgramStatus.Active)
        .WithDateStart(DateTimeOffset.UtcNow.AddDays(-7))
        .WithCompletionLimit(10)
        .WithCompletionTotal(10)
        .Build();

      var link = new ReferralLinkBuilder()
        .WithId(linkId)
        .WithProgramId(programId)
        .WithUserId(referrerUserId)
        .WithStatus(ReferralLinkStatus.Active)
        .Build();

      SetupUserService(fixture, RefereeUsername, user);
      SetupLinkService(fixture, linkId, link);
      SetupProgramService(fixture, programId, program);
      SetupCountryWorldwide(fixture);
      SetupEmptyUsageRepository(fixture);

      var sut = fixture.Build();

      // Act & Assert
      var ex = await Assert.ThrowsAsync<ValidationException>(() => sut.ClaimAsReferee(linkId));
      Assert.Contains("completion limit", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Trait("Category", "Referral")]
    [Fact]
    public async Task ClaimAsReferee_LinkNotActive_ThrowsValidationException()
    {
      // Arrange
      var fixture = new LinkUsageServiceFixture(RefereeUsername);

      var userId = Guid.NewGuid();
      var referrerUserId = Guid.NewGuid();
      var programId = Guid.NewGuid();
      var linkId = Guid.NewGuid();

      var user = new UserBuilder()
        .WithId(userId)
        .WithUsername(RefereeUsername)
        .Build();

      var program = new ProgramBuilder()
        .WithId(programId)
        .WithName("Test Program")
        .WithStatus(ProgramStatus.Active)
        .WithDateStart(DateTimeOffset.UtcNow.AddDays(-7))
        .Build();

      var link = new ReferralLinkBuilder()
        .WithId(linkId)
        .WithProgramId(programId)
        .WithUserId(referrerUserId)
        .WithStatus(ReferralLinkStatus.Cancelled)
        .Build();

      SetupUserService(fixture, RefereeUsername, user);
      SetupLinkService(fixture, linkId, link);
      SetupProgramService(fixture, programId, program);
      SetupCountryWorldwide(fixture);
      SetupEmptyUsageRepository(fixture);

      var sut = fixture.Build();

      // Act & Assert
      var ex = await Assert.ThrowsAsync<ValidationException>(() => sut.ClaimAsReferee(linkId));
      Assert.Contains("status is 'Cancelled'", ex.Message);
    }

    [Trait("Category", "Referral")]
    [Fact]
    public async Task ClaimAsReferee_PerReferrerCapReached_ThrowsValidationException()
    {
      // Arrange
      var fixture = new LinkUsageServiceFixture(RefereeUsername);

      var userId = Guid.NewGuid();
      var referrerUserId = Guid.NewGuid();
      var programId = Guid.NewGuid();
      var linkId = Guid.NewGuid();

      var user = new UserBuilder()
        .WithId(userId)
        .WithUsername(RefereeUsername)
        .Build();

      // Program with per-referrer limit (CompletionLimitReferee = 5)
      var program = new ProgramBuilder()
        .WithId(programId)
        .WithName("Test Program")
        .WithStatus(ProgramStatus.Active)
        .WithDateStart(DateTimeOffset.UtcNow.AddDays(-7))
        .WithCompletionLimitReferee(5)
        .Build();

      // Link with CompletionTotal already at the per-referrer limit
      var link = new ReferralLinkBuilder()
        .WithId(linkId)
        .WithProgramId(programId)
        .WithUserId(referrerUserId)
        .WithStatus(ReferralLinkStatus.Active)
        .WithCompletionTotal(5)
        .Build();

      SetupUserService(fixture, RefereeUsername, user);
      SetupLinkService(fixture, linkId, link);
      SetupProgramService(fixture, programId, program);
      SetupCountryWorldwide(fixture);
      SetupEmptyUsageRepository(fixture);

      var sut = fixture.Build();

      // Act & Assert
      var ex = await Assert.ThrowsAsync<ValidationException>(() => sut.ClaimAsReferee(linkId));
      Assert.Contains("completion limit", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    #endregion

    #region Helpers

    private static void SetupUserService(LinkUsageServiceFixture fixture, string username, User user)
    {
      fixture.UserService
        .Setup(x => x.GetByUsername(username, It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      fixture.UserService
        .Setup(x => x.GetById(user.Id, It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);
    }

    private static void SetupLinkService(LinkUsageServiceFixture fixture, Guid linkId, ReferralLink link)
    {
      fixture.LinkService
        .Setup(x => x.GetById(linkId, It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool?>()))
        .Returns(link);
    }

    private static void SetupProgramService(LinkUsageServiceFixture fixture, Guid programId, Program program)
    {
      fixture.ProgramService
        .Setup(x => x.GetById(programId, It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(program);
    }

    private static void SetupCountryWorldwide(LinkUsageServiceFixture fixture)
    {
      var worldwideCountryId = Guid.Parse("e0000000-0000-0000-0000-000000000099");
      var worldwideCountry = new Domain.Lookups.Models.Country
      {
        Id = worldwideCountryId,
        Name = "Worldwide",
        CodeAlpha2 = "WW",
        CodeAlpha3 = "WWW",
        CodeNumeric = "000"
      };

      fixture.CountryService
        .Setup(x => x.GetByCodeAlpha2("WW"))
        .Returns(worldwideCountry);
    }

    private static void SetupEmptyUsageRepository(LinkUsageServiceFixture fixture)
    {
      var emptyUsages = new List<ReferralLinkUsage>().AsQueryable();
      fixture.LinkUsageRepository.Setup(r => r.Query()).Returns(emptyUsages);
      fixture.LinkUsageRepository.Setup(r => r.Query(It.IsAny<LockMode>())).Returns(emptyUsages);
    }

    #endregion
  }
}
