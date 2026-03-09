using FluentValidation;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Test.Referral.Builders;
using Yoma.Core.Test.Referral.Fixtures;

namespace Yoma.Core.Test.Referral.Services
{
  [Trait("Category", "Referral")]
  public class LinkServiceTests
  {
    #region Constants
    private const string DefaultUsername = "testuser@example.com";
    #endregion

    #region Helpers
    private static readonly Guid WorldwideCountryId = Guid.Parse("e0000000-0000-0000-0000-000000000099");
    private static readonly Guid UserCountryId = Guid.Parse("e0000000-0000-0000-0000-000000000001");

    private static Country CreateWorldwideCountry() => new()
    {
      Id = WorldwideCountryId,
      Name = "Worldwide",
      CodeAlpha2 = "WW",
      CodeAlpha3 = "WWW",
      CodeNumeric = "000"
    };

    private static Country CreateUserCountry() => new()
    {
      Id = UserCountryId,
      Name = "South Africa",
      CodeAlpha2 = "ZA",
      CodeAlpha3 = "ZAF",
      CodeNumeric = "710"
    };

    /// <summary>
    /// Sets up all common mocks required for a Create call:
    /// ProgramService, UserService, CountryService, execution strategy, and repository query.
    /// </summary>
    private static void SetupCreateMocks(
      LinkServiceFixture fixture,
      Program program,
      User user,
      List<ReferralLink>? existingLinks = null)
    {
      fixture.ExecutionStrategyService
        .Setup(x => x.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>()))
        .Returns((Func<Task> action) => action());

      fixture.ProgramService
        .Setup(x => x.GetById(program.Id, It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<Domain.Core.LockMode>()))
        .Returns(program);

      fixture.ProgramService
        .Setup(x => x.ReferrerAdded(It.IsAny<Program>()))
        .ReturnsAsync((Program p) => p);

      fixture.UserService
        .Setup(x => x.GetByUsername(DefaultUsername, It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      fixture.CountryService
        .Setup(x => x.GetByCodeAlpha2("WW"))
        .Returns(CreateWorldwideCountry());

      var queryable = (existingLinks ?? []).AsQueryable();
      fixture.LinkRepository.Setup(r => r.Query()).Returns(queryable);
      fixture.LinkRepository.Setup(r => r.Query(It.IsAny<bool>())).Returns(queryable);
    }
    #endregion

    #region Create Tests

    [Fact]
    public async Task Create_ActiveProgramStarted_ReturnsLinkWithShortURL()
    {
      // Arrange
      var fixture = new LinkServiceFixture(DefaultUsername);

      var program = new ProgramBuilder()
        .WithStatus(ProgramStatus.Active)
        .WithDateStart(DateTimeOffset.UtcNow.AddDays(-7))
        .WithDateEnd(null)
        .WithCountries([CreateUserCountry(), CreateWorldwideCountry()])
        .WithMultipleLinksAllowed(false)
        .Build();

      var user = new UserBuilder()
        .WithUsername(DefaultUsername)
        .WithCountryId(UserCountryId)
        .Build();

      SetupCreateMocks(fixture, program, user);

      var service = fixture.Build();
      var request = new ReferralLinkRequestCreate
      {
        ProgramId = program.Id,
        Name = "My New Link",
        Description = "A test link"
      };

      // Act
      var result = await service.Create(request);

      // Assert
      Assert.NotNull(result);
      Assert.Equal("My New Link", result.Name);
      Assert.Equal("A test link", result.Description);
      Assert.Equal(program.Id, result.ProgramId);
      Assert.Equal(user.Id, result.UserId);
      Assert.Equal(ReferralLinkStatus.Active, result.Status);
      Assert.Equal(LookupBuilder.LinkStatusActiveId, result.StatusId);
      Assert.Equal("https://short.link/abc", result.ShortURL);
      Assert.False(result.Blocked);

      fixture.ProgramService.Verify(x => x.ReferrerAdded(It.Is<Program>(p => p.Id == program.Id)), Times.Once);
    }

    [Fact]
    public async Task Create_ProgramNotActive_ThrowsValidationException()
    {
      // Arrange
      var fixture = new LinkServiceFixture(DefaultUsername);

      var program = new ProgramBuilder()
        .WithStatus(ProgramStatus.Inactive)
        .WithDateStart(DateTimeOffset.UtcNow.AddDays(-7))
        .Build();

      fixture.ExecutionStrategyService
        .Setup(x => x.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>()))
        .Returns((Func<Task> action) => action());

      fixture.ProgramService
        .Setup(x => x.GetById(program.Id, It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<Domain.Core.LockMode>()))
        .Returns(program);

      var service = fixture.Build();
      var request = new ReferralLinkRequestCreate
      {
        ProgramId = program.Id,
        Name = "Test Link"
      };

      // Act & Assert
      var ex = await Assert.ThrowsAsync<ValidationException>(() => service.Create(request));
      Assert.Contains("not active", ex.Message);
    }

    [Fact]
    public async Task Create_ProgramNotStarted_ThrowsValidationException()
    {
      // Arrange
      var fixture = new LinkServiceFixture(DefaultUsername);

      var program = new ProgramBuilder()
        .WithStatus(ProgramStatus.Active)
        .WithDateStart(DateTimeOffset.UtcNow.AddDays(7))
        .Build();

      fixture.ExecutionStrategyService
        .Setup(x => x.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>()))
        .Returns((Func<Task> action) => action());

      fixture.ProgramService
        .Setup(x => x.GetById(program.Id, It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<Domain.Core.LockMode>()))
        .Returns(program);

      var service = fixture.Build();
      var request = new ReferralLinkRequestCreate
      {
        ProgramId = program.Id,
        Name = "Test Link"
      };

      // Act & Assert
      var ex = await Assert.ThrowsAsync<ValidationException>(() => service.Create(request));
      Assert.Contains("not active or has not started", ex.Message);
    }

    [Fact]
    public async Task Create_ProgramExpiredByEndDate_ThrowsValidationException()
    {
      // Arrange
      var fixture = new LinkServiceFixture(DefaultUsername);

      var program = new ProgramBuilder()
        .WithStatus(ProgramStatus.Active)
        .WithDateStart(DateTimeOffset.UtcNow.AddDays(-30))
        .WithDateEnd(DateTimeOffset.UtcNow.AddDays(-1))
        .Build();

      fixture.ExecutionStrategyService
        .Setup(x => x.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>()))
        .Returns((Func<Task> action) => action());

      fixture.ProgramService
        .Setup(x => x.GetById(program.Id, It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<Domain.Core.LockMode>()))
        .Returns(program);

      var service = fixture.Build();
      var request = new ReferralLinkRequestCreate
      {
        ProgramId = program.Id,
        Name = "Test Link"
      };

      // Act & Assert
      var ex = await Assert.ThrowsAsync<ValidationException>(() => service.Create(request));
      Assert.Contains("expired", ex.Message);
    }

    [Fact]
    public async Task Create_ProgramCompletionLimitReached_ThrowsValidationException()
    {
      // Arrange
      var fixture = new LinkServiceFixture(DefaultUsername);

      var program = new ProgramBuilder()
        .WithStatus(ProgramStatus.Active)
        .WithDateStart(DateTimeOffset.UtcNow.AddDays(-7))
        .WithCompletionLimit(10)
        .WithCompletionTotal(10)
        .Build();

      fixture.ExecutionStrategyService
        .Setup(x => x.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>()))
        .Returns((Func<Task> action) => action());

      fixture.ProgramService
        .Setup(x => x.GetById(program.Id, It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<Domain.Core.LockMode>()))
        .Returns(program);

      var service = fixture.Build();
      var request = new ReferralLinkRequestCreate
      {
        ProgramId = program.Id,
        Name = "Test Link"
      };

      // Act & Assert
      var ex = await Assert.ThrowsAsync<ValidationException>(() => service.Create(request));
      Assert.Contains("completion limit", ex.Message);
    }

    [Fact]
    public async Task Create_UserCountryNotInProgramCountries_ThrowsValidationException()
    {
      // Arrange
      var fixture = new LinkServiceFixture(DefaultUsername);

      var otherCountryId = Guid.Parse("e0000000-0000-0000-0000-000000000055");
      var otherCountry = new Country
      {
        Id = otherCountryId,
        Name = "Other Country",
        CodeAlpha2 = "OC",
        CodeAlpha3 = "OTH",
        CodeNumeric = "999"
      };

      var program = new ProgramBuilder()
        .WithStatus(ProgramStatus.Active)
        .WithDateStart(DateTimeOffset.UtcNow.AddDays(-7))
        .WithCountries([otherCountry])
        .Build();

      var user = new UserBuilder()
        .WithUsername(DefaultUsername)
        .WithCountryId(UserCountryId)
        .Build();

      fixture.ExecutionStrategyService
        .Setup(x => x.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>()))
        .Returns((Func<Task> action) => action());

      fixture.ProgramService
        .Setup(x => x.GetById(program.Id, It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<Domain.Core.LockMode>()))
        .Returns(program);

      fixture.UserService
        .Setup(x => x.GetByUsername(DefaultUsername, It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      fixture.CountryService
        .Setup(x => x.GetByCodeAlpha2("WW"))
        .Returns(CreateWorldwideCountry());

      fixture.LinkRepository.Setup(r => r.Query()).Returns(new List<ReferralLink>().AsQueryable());
      fixture.LinkRepository.Setup(r => r.Query(It.IsAny<bool>())).Returns(new List<ReferralLink>().AsQueryable());

      var service = fixture.Build();
      var request = new ReferralLinkRequestCreate
      {
        ProgramId = program.Id,
        Name = "Test Link"
      };

      // Act & Assert
      var ex = await Assert.ThrowsAsync<ValidationException>(() => service.Create(request));
      Assert.Contains("not available in your country", ex.Message);
    }

    [Fact]
    public async Task Create_MultipleLinksNotAllowed_ExistingActiveLink_ThrowsValidationException()
    {
      // Arrange
      var fixture = new LinkServiceFixture(DefaultUsername);

      var program = new ProgramBuilder()
        .WithStatus(ProgramStatus.Active)
        .WithDateStart(DateTimeOffset.UtcNow.AddDays(-7))
        .WithMultipleLinksAllowed(false)
        .WithCountries([CreateWorldwideCountry()])
        .Build();

      var user = new UserBuilder()
        .WithUsername(DefaultUsername)
        .WithCountryId(UserCountryId)
        .Build();

      var existingLink = new ReferralLinkBuilder()
        .WithProgramId(program.Id)
        .WithUserId(user.Id)
        .WithStatus(ReferralLinkStatus.Active)
        .WithName("Existing Link")
        .Build();

      SetupCreateMocks(fixture, program, user, [existingLink]);

      var service = fixture.Build();
      var request = new ReferralLinkRequestCreate
      {
        ProgramId = program.Id,
        Name = "Another Link"
      };

      // Act & Assert
      var ex = await Assert.ThrowsAsync<ValidationException>(() => service.Create(request));
      Assert.Contains("Multiple active referral links are not allowed", ex.Message);

      fixture.ProgramService.Verify(x => x.ReferrerAdded(It.IsAny<Program>()), Times.Never);
    }

    [Fact]
    public async Task Create_MultipleLinksAllowed_ExistingActiveLink_Succeeds()
    {
      // Arrange
      var fixture = new LinkServiceFixture(DefaultUsername);

      var program = new ProgramBuilder()
        .WithStatus(ProgramStatus.Active)
        .WithDateStart(DateTimeOffset.UtcNow.AddDays(-7))
        .WithMultipleLinksAllowed(true)
        .WithCountries([CreateWorldwideCountry()])
        .Build();

      var user = new UserBuilder()
        .WithUsername(DefaultUsername)
        .WithCountryId(UserCountryId)
        .Build();

      var existingLink = new ReferralLinkBuilder()
        .WithProgramId(program.Id)
        .WithUserId(user.Id)
        .WithStatus(ReferralLinkStatus.Active)
        .WithName("Existing Link")
        .Build();

      SetupCreateMocks(fixture, program, user, [existingLink]);

      var service = fixture.Build();
      var request = new ReferralLinkRequestCreate
      {
        ProgramId = program.Id,
        Name = "Second Link"
      };

      // Act
      var result = await service.Create(request);

      // Assert
      Assert.NotNull(result);
      Assert.Equal("Second Link", result.Name);
      Assert.Equal(ReferralLinkStatus.Active, result.Status);
      Assert.Equal("https://short.link/abc", result.ShortURL);

      fixture.ProgramService.Verify(x => x.ReferrerAdded(It.IsAny<Program>()), Times.Never);
    }

    [Fact]
    public async Task Create_DuplicateName_ThrowsValidationException()
    {
      // Arrange
      var fixture = new LinkServiceFixture(DefaultUsername);

      var program = new ProgramBuilder()
        .WithStatus(ProgramStatus.Active)
        .WithDateStart(DateTimeOffset.UtcNow.AddDays(-7))
        .WithMultipleLinksAllowed(true)
        .WithCountries([CreateWorldwideCountry()])
        .Build();

      var user = new UserBuilder()
        .WithUsername(DefaultUsername)
        .WithCountryId(UserCountryId)
        .Build();

      var existingLink = new ReferralLinkBuilder()
        .WithProgramId(program.Id)
        .WithUserId(user.Id)
        .WithStatus(ReferralLinkStatus.Active)
        .WithName("Duplicate Name")
        .Build();

      SetupCreateMocks(fixture, program, user, [existingLink]);

      var service = fixture.Build();
      var request = new ReferralLinkRequestCreate
      {
        ProgramId = program.Id,
        Name = "Duplicate Name"
      };

      // Act & Assert
      var ex = await Assert.ThrowsAsync<ValidationException>(() => service.Create(request));
      Assert.Contains("already exists", ex.Message);

      fixture.ProgramService.Verify(x => x.ReferrerAdded(It.IsAny<Program>()), Times.Never);
    }

    #endregion

    #region Cancel Tests

    [Fact]
    public async Task Cancel_ActiveLink_StatusSetToCancelled()
    {
      // Arrange
      var fixture = new LinkServiceFixture(DefaultUsername);

      var user = new UserBuilder()
        .WithUsername(DefaultUsername)
        .Build();

      var link = new ReferralLinkBuilder()
        .WithUserId(user.Id)
        .WithStatus(ReferralLinkStatus.Active)
        .Build();

      var links = new List<ReferralLink> { link }.AsQueryable();
      fixture.LinkRepository.Setup(r => r.Query(true)).Returns(links);
      fixture.LinkRepository.Setup(r => r.Query(It.IsAny<bool>())).Returns(links);

      fixture.UserService
        .Setup(x => x.GetByUsername(DefaultUsername, It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      var service = fixture.Build();

      // Act
      var result = await service.Cancel(link.Id);

      // Assert
      Assert.Equal(ReferralLinkStatus.Cancelled, result.Status);
      Assert.Equal(LookupBuilder.LinkStatusCancelledId, result.StatusId);
      fixture.LinkRepository.Verify(r => r.Update(It.Is<ReferralLink>(l => l.Status == ReferralLinkStatus.Cancelled)), Times.Once);
    }

    [Fact]
    public async Task Cancel_NonCancellableStatus_ReturnsUnchanged()
    {
      // Arrange
      var fixture = new LinkServiceFixture(DefaultUsername);

      var user = new UserBuilder()
        .WithUsername(DefaultUsername)
        .Build();

      var link = new ReferralLinkBuilder()
        .WithUserId(user.Id)
        .WithStatus(ReferralLinkStatus.Cancelled)
        .Build();

      var links = new List<ReferralLink> { link }.AsQueryable();
      fixture.LinkRepository.Setup(r => r.Query(true)).Returns(links);
      fixture.LinkRepository.Setup(r => r.Query(It.IsAny<bool>())).Returns(links);

      fixture.UserService
        .Setup(x => x.GetByUsername(DefaultUsername, It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      var service = fixture.Build();

      // Act
      var result = await service.Cancel(link.Id);

      // Assert
      Assert.Equal(ReferralLinkStatus.Cancelled, result.Status);
      fixture.LinkRepository.Verify(r => r.Update(It.IsAny<ReferralLink>()), Times.Never);
    }

    #endregion

    #region GetById / GetByIdOrNull Tests

    [Fact]
    public void GetById_ExistingId_ReturnsLink()
    {
      // Arrange
      var fixture = new LinkServiceFixture(DefaultUsername);

      var user = new UserBuilder()
        .WithUsername(DefaultUsername)
        .Build();

      var link = new ReferralLinkBuilder()
        .WithUserId(user.Id)
        .WithStatus(ReferralLinkStatus.Active)
        .Build();

      var links = new List<ReferralLink> { link }.AsQueryable();
      fixture.LinkRepository.Setup(r => r.Query(It.IsAny<bool>())).Returns(links);

      fixture.UserService
        .Setup(x => x.GetByUsername(DefaultUsername, It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      var service = fixture.Build();

      // Act
      var result = service.GetById(link.Id, false, true, false, false);

      // Assert
      Assert.NotNull(result);
      Assert.Equal(link.Id, result.Id);
      Assert.Equal(link.Name, result.Name);
      Assert.Equal(link.UserId, result.UserId);
    }

    [Fact]
    public void GetById_NonExistingId_ThrowsEntityNotFoundException()
    {
      // Arrange
      var fixture = new LinkServiceFixture(DefaultUsername);
      var service = fixture.Build();

      var nonExistentId = Guid.NewGuid();

      // Act & Assert
      Assert.Throws<EntityNotFoundException>(() =>
        service.GetById(nonExistentId, false, false, false, false));
    }

    #endregion
  }
}
