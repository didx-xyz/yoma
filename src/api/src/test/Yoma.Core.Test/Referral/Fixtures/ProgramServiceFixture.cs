using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Services;
using Yoma.Core.Domain.Referral.Validators;
using Yoma.Core.Domain.ShortLinkProvider.Interfaces;
using Yoma.Core.Domain.Treasury.Interfaces;
using Yoma.Core.Domain.Treasury.Models;

namespace Yoma.Core.Test.Referral.Fixtures
{
  public class ProgramServiceFixture
  {
    #region Public Properties – Mocks
    public Mock<ILogger<ProgramService>> Logger { get; }
    public Mock<IOptions<AppSettings>> AppSettings { get; }
    public Mock<IHttpContextAccessor> HttpContextAccessor { get; }
    public Mock<IProgramStatusService> ProgramStatusService { get; }
    public Mock<IOpportunityService> OpportunityService { get; }
    public Mock<IBlobService> BlobService { get; }
    public Mock<IUserService> UserService { get; }
    public Mock<ILinkMaintenanceService> LinkMaintenanceService { get; }
    public Mock<ICountryService> CountryService { get; }
    public Mock<ILinkStatusService> LinkStatusService { get; }
    public Mock<ITreasuryService> TreasuryService { get; }
    public Mock<IRepository<ProgramCountry>> ProgramCountryRepository { get; }
    public Mock<IRepositoryBatchedValueContainsWithNavigation<ReferralLink>> LinkRepository { get; }
    public Mock<IExecutionStrategyService> ExecutionStrategyService { get; }
    public Mock<IShortLinkProviderClientFactory> ShortLinkProviderClientFactory { get; }
    public Mock<IShortLinkProviderClient> ShortLinkProviderClient { get; }
    public Mock<ProgramSearchFilterValidator> ProgramSearchFilterValidator { get; }
    public Mock<ProgramRequestValidatorCreate> ProgramRequestValidatorCreate { get; }
    public Mock<ProgramRequestValidatorUpdate> ProgramRequestValidatorUpdate { get; }
    public Mock<IRepositoryBatchedValueContainsWithNavigation<Program>> ProgramRepository { get; }
    public Mock<IRepositoryWithNavigation<ProgramPathway>> ProgramPathwayRepository { get; }
    public Mock<IRepositoryWithNavigation<ProgramPathwayStep>> ProgramPathwayStepRepository { get; }
    public Mock<IRepository<ProgramPathwayTask>> ProgramPathwayTaskRepository { get; }
    #endregion

    #region Constructor
    public ProgramServiceFixture(string username = "testuser@example.com", params string[] roles)
    {
      Logger = new Mock<ILogger<ProgramService>>();

      AppSettings = new Mock<IOptions<AppSettings>>();
      AppSettings.Setup(x => x.Value).Returns(new AppSettings());

      HttpContextAccessor = MockHttpContextAccessor.Create(username, roles);

      ProgramStatusService = MockLookupServices.CreateProgramStatusService();
      OpportunityService = new Mock<IOpportunityService>();
      BlobService = new Mock<IBlobService>();
      UserService = new Mock<IUserService>();
      LinkMaintenanceService = new Mock<ILinkMaintenanceService>();
      CountryService = new Mock<ICountryService>();
      LinkStatusService = new Mock<ILinkStatusService>();

      TreasuryService = new Mock<ITreasuryService>();
      TreasuryService.Setup(x => x.Get()).Returns(new TreasuryInfo());

      ProgramCountryRepository = new Mock<IRepository<ProgramCountry>>();
      SetupBaseRepository(ProgramCountryRepository);

      LinkRepository = new Mock<IRepositoryBatchedValueContainsWithNavigation<ReferralLink>>();
      SetupBatchedNavRepository(LinkRepository);

      ExecutionStrategyService = new Mock<IExecutionStrategyService>();
      ExecutionStrategyService
        .Setup(x => x.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>()))
        .Returns<Func<Task>>(async action => await action());
      ExecutionStrategyService
        .Setup(x => x.ExecuteInExecutionStrategy(It.IsAny<Action>()))
        .Callback<Action>(action => action());

      ShortLinkProviderClientFactory = new Mock<IShortLinkProviderClientFactory>();
      ShortLinkProviderClient = new Mock<IShortLinkProviderClient>();
      ShortLinkProviderClientFactory.Setup(x => x.CreateClient()).Returns(ShortLinkProviderClient.Object);

      ProgramSearchFilterValidator = new Mock<ProgramSearchFilterValidator>() { CallBase = false };
      ProgramRequestValidatorCreate = new Mock<ProgramRequestValidatorCreate>(CountryService.Object) { CallBase = false };
      ProgramRequestValidatorUpdate = new Mock<ProgramRequestValidatorUpdate>(CountryService.Object) { CallBase = false };

      ProgramRepository = new Mock<IRepositoryBatchedValueContainsWithNavigation<Program>>();
      SetupBatchedNavRepository(ProgramRepository);

      ProgramPathwayRepository = new Mock<IRepositoryWithNavigation<ProgramPathway>>();
      SetupNavRepository(ProgramPathwayRepository);

      ProgramPathwayStepRepository = new Mock<IRepositoryWithNavigation<ProgramPathwayStep>>();
      SetupNavRepository(ProgramPathwayStepRepository);

      ProgramPathwayTaskRepository = new Mock<IRepository<ProgramPathwayTask>>();
      SetupBaseRepository(ProgramPathwayTaskRepository);
    }
    #endregion

    #region Public Members
    public ProgramService Build()
    {
      return new ProgramService(
        Logger.Object,
        AppSettings.Object,
        HttpContextAccessor.Object,

        ProgramStatusService.Object,
        OpportunityService.Object,
        BlobService.Object,
        UserService.Object,
        LinkMaintenanceService.Object,
        CountryService.Object,
        LinkStatusService.Object,
        TreasuryService.Object,

        ExecutionStrategyService.Object,
        ShortLinkProviderClientFactory.Object,

        ProgramSearchFilterValidator.Object,
        ProgramRequestValidatorCreate.Object,
        ProgramRequestValidatorUpdate.Object,

        ProgramCountryRepository.Object,
        LinkRepository.Object,
        ProgramRepository.Object,
        ProgramPathwayRepository.Object,
        ProgramPathwayStepRepository.Object,
        ProgramPathwayTaskRepository.Object);
    }
    #endregion

    #region Private Members
    private static void SetupBaseRepository<T>(Mock<IRepository<T>> mock) where T : class
    {
      var empty = new List<T>().AsQueryable();

      mock.Setup(r => r.Query()).Returns(empty);
      mock.Setup(r => r.Query(It.IsAny<LockMode>())).Returns(empty);

      mock.Setup(r => r.Create(It.IsAny<T>())).ReturnsAsync((T item) => item);
      mock.Setup(r => r.Update(It.IsAny<T>())).ReturnsAsync((T item) => item);
    }

    private static void SetupNavRepository<T>(Mock<IRepositoryWithNavigation<T>> mock) where T : class
    {
      var empty = new List<T>().AsQueryable();

      mock.Setup(r => r.Query()).Returns(empty);
      mock.Setup(r => r.Query(It.IsAny<LockMode>())).Returns(empty);
      mock.Setup(r => r.Query(It.IsAny<bool>())).Returns(empty);
      mock.Setup(r => r.Query(It.IsAny<bool>(), It.IsAny<LockMode>())).Returns(empty);

      mock.Setup(r => r.Create(It.IsAny<T>())).ReturnsAsync((T item) => item);
      mock.Setup(r => r.Update(It.IsAny<T>())).ReturnsAsync((T item) => item);
    }

    private static void SetupBatchedNavRepository<T>(Mock<IRepositoryBatchedValueContainsWithNavigation<T>> mock) where T : class
    {
      var empty = new List<T>().AsQueryable();

      mock.Setup(r => r.Query()).Returns(empty);
      mock.Setup(r => r.Query(It.IsAny<LockMode>())).Returns(empty);
      mock.Setup(r => r.Query(It.IsAny<bool>())).Returns(empty);
      mock.Setup(r => r.Query(It.IsAny<bool>(), It.IsAny<LockMode>())).Returns(empty);

      mock.Setup(r => r.Create(It.IsAny<T>())).ReturnsAsync((T item) => item);
      mock.Setup(r => r.Update(It.IsAny<T>())).ReturnsAsync((T item) => item);
      mock.Setup(r => r.Create(It.IsAny<List<T>>())).ReturnsAsync((List<T> items) => items);
      mock.Setup(r => r.Update(It.IsAny<List<T>>())).ReturnsAsync((List<T> items) => items);
    }
    #endregion
  }
}
