using FluentValidation;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Test.Referral.Builders;
using Yoma.Core.Test.Referral.Fixtures;

namespace Yoma.Core.Test.Referral.Services
{
  [Trait("Category", "Referral")]
  public class ProgramServiceTests
  {
    #region Metadata
    [Fact]
    public async Task ImageUpdatePreservesTheLockedAccountingSnapshot()
    {
      var fixture = new ProgramServiceFixture();
      var initial = new ProgramBuilder().WithCompletionTotal(1).WithRewards(10, 10, 25).Build();
      var current = new ProgramBuilder().WithId(initial.Id).WithCompletionTotal(2)
        .WithRewards(10, 10, 25).WithZltoRewardCumulative(20).Build();
      fixture.ProgramRepository.Setup(repository => repository.Query(false)).Returns(new[] { initial }.AsQueryable());
      fixture.ProgramRepository.Setup(repository => repository.Query(false, LockMode.Wait)).Returns(new[] { current }.AsQueryable());
      fixture.UserService.Setup(service => service.GetCurrentUser(false, false, It.IsAny<bool>()))
        .Returns(new Domain.Entity.Models.User { Id = Guid.NewGuid() });
      using var stream = new MemoryStream([1]);
      var file = new Microsoft.AspNetCore.Http.FormFile(stream, 0, stream.Length, "image", "image.png");
      fixture.BlobService.Setup(service => service.Create(FileType.Photos, Domain.BlobProvider.StorageType.Public, file, null))
        .ReturnsAsync(new Domain.Core.Models.BlobObject { Id = Guid.NewGuid() });

      var result = await fixture.Build().UpdateImage(initial.Id, file);

      Assert.Equal(2, result.CompletionTotal);
      Assert.Equal(20, result.ZltoRewardCumulative);
      Assert.NotNull(result.ZltoRewardEstimate);
      Assert.Equal(5, result.ZltoRewardEstimate.Referee);
      Assert.Equal(0, result.ZltoRewardEstimate.Referrer);
      fixture.ProgramRepository.Verify(repository => repository.Update(It.Is<Program>(program =>
        program.CompletionTotal == 2 && program.ZltoRewardCumulative == 20)), Times.Exactly(2));
    }

    [Fact]
    public async Task ShortLinkGenerationPreservesAccountingCommittedDuringTheExternalCall()
    {
      var fixture = new ProgramServiceFixture();
      fixture.AppSettings.Setup(options => options.Value).Returns(new Domain.Core.Models.AppSettings { AppBaseURL = "https://example.org" });
      var initial = new ProgramBuilder().WithCompletionTotal(1).Build();
      var current = new ProgramBuilder().WithId(initial.Id).WithCompletionTotal(2).WithZltoRewardCumulative(20).Build();
      fixture.ProgramRepository.Setup(repository => repository.Query(false)).Returns(new[] { initial }.AsQueryable());
      fixture.ProgramRepository.Setup(repository => repository.Query(true, LockMode.Wait)).Returns(new[] { current }.AsQueryable());
      fixture.ShortLinkProviderClient.Setup(client => client.CreateShortLink(It.IsAny<Domain.ShortLinkProvider.Models.ShortLinkRequest>()))
        .ReturnsAsync(new Domain.ShortLinkProvider.Models.ShortLinkResponse { Link = "https://example.org/short" });

      await fixture.Build().GetOrCreateShortLinkReferrer(initial.Id, false);

      fixture.ProgramRepository.Verify(repository => repository.Update(It.Is<Program>(program =>
        program.CompletionTotal == 2 && program.ZltoRewardCumulative == 20 && program.ReferrerShortURL == "https://example.org/short")), Times.Once);
    }
    #endregion

    #region GetById
    [Fact]
    public void GetById_ExistingId_ReturnsProgram()
    {
      // Arrange
      var fixture = new ProgramServiceFixture();
      var programId = Guid.NewGuid();
      var program = new ProgramBuilder()
        .WithId(programId)
        .WithStatus(ProgramStatus.Active)
        .Build();
      var programs = new List<Program> { program }.AsQueryable();
      fixture.ProgramRepository.Setup(r => r.Query(It.IsAny<bool>())).Returns(programs);

      var service = fixture.Build();

      // Act
      var result = service.GetById(programId, true, false);

      // Assert
      Assert.NotNull(result);
      Assert.Equal(programId, result.Id);
      Assert.Equal(program.Name, result.Name);
    }

    [Fact]
    public void GetById_NonExistingId_ThrowsEntityNotFoundException()
    {
      // Arrange
      var fixture = new ProgramServiceFixture();
      var service = fixture.Build();
      var nonExistingId = Guid.NewGuid();

      // Act & Assert
      Assert.Throws<EntityNotFoundException>(() => service.GetById(nonExistingId, true, false));
    }
    #endregion

    #region UpdateStatus
    [Fact]
    public async Task UpdateStatus_InactiveToActive_Success()
    {
      // Arrange
      var fixture = new ProgramServiceFixture();
      var programId = Guid.NewGuid();
      var userId = Guid.NewGuid();
      var user = new UserBuilder().WithId(userId).Build();

      var program = new ProgramBuilder()
        .WithId(programId)
        .WithStatus(ProgramStatus.Inactive)
        .WithDateEnd(DateTimeOffset.UtcNow.AddDays(30))
        .Build();

      var programs = new List<Program> { program }.AsQueryable();
      fixture.ProgramRepository.Setup(r => r.Query(It.IsAny<bool>())).Returns(programs);
      fixture.ProgramRepository.Setup(r => r.Query(It.IsAny<bool>(), It.IsAny<LockMode>())).Returns(programs);

      fixture.UserService
        .Setup(x => x.GetCurrentUser(It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      var service = fixture.Build();

      // Act
      await service.UpdateStatus(programId, ProgramStatus.Active);

      // Assert
      Assert.Equal(ProgramStatus.Active, program.Status);
    }

    [Fact]
    public async Task UpdateStatus_ActiveToDeleted_CancelsLinks()
    {
      // Arrange
      var fixture = new ProgramServiceFixture();
      var programId = Guid.NewGuid();
      var userId = Guid.NewGuid();
      var user = new UserBuilder().WithId(userId).Build();

      var program = new ProgramBuilder()
        .WithId(programId)
        .WithStatus(ProgramStatus.Active)
        .Build();

      var programs = new List<Program> { program }.AsQueryable();
      fixture.ProgramRepository.Setup(r => r.Query(It.IsAny<bool>())).Returns(programs);
      fixture.ProgramRepository.Setup(r => r.Query(It.IsAny<bool>(), It.IsAny<LockMode>())).Returns(programs);

      fixture.UserService
        .Setup(x => x.GetCurrentUser(It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      var service = fixture.Build();

      // Act
      await service.UpdateStatus(programId, ProgramStatus.Deleted);

      // Assert
      Assert.Equal(ProgramStatus.Deleted, program.Status);

      fixture.LinkMaintenanceService.Verify(
        x => x.CancelByProgramId(programId, null),
        Times.Once);
    }

    [Fact]
    public async Task UpdateStatus_InvalidTransition_ThrowsValidationException()
    {
      // Arrange
      var fixture = new ProgramServiceFixture();
      var programId = Guid.NewGuid();
      var userId = Guid.NewGuid();
      var user = new UserBuilder().WithId(userId).Build();

      var program = new ProgramBuilder()
        .WithId(programId)
        .WithStatus(ProgramStatus.Expired)
        .Build();

      var programs = new List<Program> { program }.AsQueryable();
      fixture.ProgramRepository.Setup(r => r.Query(It.IsAny<bool>())).Returns(programs);
      fixture.ProgramRepository.Setup(r => r.Query(It.IsAny<bool>(), It.IsAny<LockMode>())).Returns(programs);

      fixture.UserService
        .Setup(x => x.GetCurrentUser(It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      var service = fixture.Build();

      // Act & Assert
      await Assert.ThrowsAsync<ValidationException>(() => service.UpdateStatus(programId, ProgramStatus.Active));
    }
    #endregion

    #region ProcessCompletion
    [Fact]
    public async Task ProcessCompletion_IncrementsTotal_RemainsActive()
    {
      // Arrange
      var fixture = new ProgramServiceFixture();
      var programId = Guid.NewGuid();

      var program = new ProgramBuilder()
        .WithId(programId)
        .WithStatus(ProgramStatus.Active)
        .WithCompletionLimit(10)
        .WithCompletionTotal(0)
        .Build();

      var programs = new List<Program> { program }.AsQueryable();
      fixture.ProgramRepository.Setup(r => r.Query(It.IsAny<LockMode>())).Returns(programs);

      var service = fixture.Build();

      // Act
      var result = await service.ProcessCompletion(program, null);

      // Assert
      fixture.ProgramRepository.Verify(
        r => r.Update(It.Is<Program>(p => p.CompletionTotal == 1)),
        Times.Once);
      Assert.Equal(ProgramStatus.Active, result.Status);
    }

    [Fact]
    public async Task ProcessCompletion_GlobalCapReached_FlipsToLimitReached()
    {
      // Arrange
      var fixture = new ProgramServiceFixture();
      var programId = Guid.NewGuid();

      var program = new ProgramBuilder()
        .WithId(programId)
        .WithStatus(ProgramStatus.Active)
        .WithCompletionLimit(1)
        .WithCompletionTotal(0)
        .Build();

      var programs = new List<Program> { program }.AsQueryable();
      fixture.ProgramRepository.Setup(r => r.Query(It.IsAny<LockMode>())).Returns(programs);

      var service = fixture.Build();

      // Act
      var result = await service.ProcessCompletion(program, null);

      // Assert
      Assert.Equal(ProgramStatus.LimitReached, result.Status);
      fixture.LinkMaintenanceService.Verify(
        x => x.LimitReachedByProgramId(programId, It.IsAny<Microsoft.Extensions.Logging.ILogger>()),
        Times.Once);
    }
    #endregion

    #region SetAsDefault
    [Fact]
    public async Task SetAsDefault_WorldwideProgram_Success()
    {
      // Arrange
      var fixture = new ProgramServiceFixture();
      var programId = Guid.NewGuid();
      var userId = Guid.NewGuid();
      var user = new UserBuilder().WithId(userId).Build();

      // Program with no countries (implicit worldwide)
      var program = new ProgramBuilder()
        .WithId(programId)
        .WithStatus(ProgramStatus.Active)
        .WithCountries(null)
        .Build();

      var programs = new List<Program> { program }.AsQueryable();
      fixture.ProgramRepository.Setup(r => r.Query(It.IsAny<bool>())).Returns(programs);
      fixture.ProgramRepository.Setup(r => r.Query(It.IsAny<bool>(), It.IsAny<LockMode>())).Returns(programs);

      fixture.UserService
        .Setup(x => x.GetCurrentUser(It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      // CountryService.GetByCodeAlpha2("WW") needed by SetAsDefault internals
      var worldwideCountry = new Domain.Lookups.Models.Country { Id = Guid.NewGuid(), Name = "Worldwide", CodeAlpha2 = "WW" };
      fixture.CountryService
        .Setup(x => x.GetByCodeAlpha2("WW"))
        .Returns(worldwideCountry);

      var service = fixture.Build();

      // Act
      await service.SetAsDefault(programId);

      // Assert
      Assert.True(program.IsDefault);
    }

    [Fact]
    public async Task SetAsDefault_NonWorldwideProgram_ThrowsValidationException()
    {
      // Arrange
      var fixture = new ProgramServiceFixture();
      var programId = Guid.NewGuid();
      var userId = Guid.NewGuid();
      var user = new UserBuilder().WithId(userId).Build();

      var worldwideCountryId = Guid.NewGuid();
      var specificCountryId = Guid.NewGuid();

      // Program with specific countries (not worldwide)
      var program = new ProgramBuilder()
        .WithId(programId)
        .WithStatus(ProgramStatus.Active)
        .WithCountries([new Domain.Lookups.Models.Country { Id = specificCountryId, Name = "South Africa", CodeAlpha2 = "ZA" }])
        .Build();

      var programs = new List<Program> { program }.AsQueryable();
      fixture.ProgramRepository.Setup(r => r.Query(It.IsAny<bool>())).Returns(programs);
      fixture.ProgramRepository.Setup(r => r.Query(It.IsAny<bool>(), It.IsAny<LockMode>())).Returns(programs);

      fixture.UserService
        .Setup(x => x.GetCurrentUser(It.IsAny<bool>(), It.IsAny<bool>(), It.IsAny<bool>()))
        .Returns(user);

      var worldwideCountry = new Domain.Lookups.Models.Country { Id = worldwideCountryId, Name = "Worldwide", CodeAlpha2 = "WW" };
      fixture.CountryService
        .Setup(x => x.GetByCodeAlpha2("WW"))
        .Returns(worldwideCountry);

      var service = fixture.Build();

      // Act & Assert
      await Assert.ThrowsAsync<ValidationException>(() => service.SetAsDefault(programId));
    }
    #endregion
  }
}
