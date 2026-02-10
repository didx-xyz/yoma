using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Services;
using Yoma.Core.Domain.Referral.Validators;
using Yoma.Core.Domain.ShortLinkProvider.Interfaces;
using Yoma.Core.Domain.ShortLinkProvider.Models;

namespace Yoma.Core.Test.Referral.Fixtures
{
  public class LinkServiceFixture
  {
    #region Public Properties – Mocks
    public Mock<ILogger<LinkService>> Logger { get; }
    public Mock<IOptions<AppSettings>> AppSettingsOptions { get; }
    public AppSettings AppSettings { get; }
    public Mock<IHttpContextAccessor> HttpContextAccessor { get; }
    public Mock<IShortLinkProviderClientFactory> ShortLinkProviderClientFactory { get; }
    public Mock<IShortLinkProviderClient> ShortLinkProviderClient { get; }
    public Mock<IUserService> UserService { get; }
    public Mock<IProgramInfoService> ProgramInfoService { get; }
    public Mock<ILinkStatusService> LinkStatusService { get; }
    public Mock<ILinkUsageStatusService> LinkUsageStatusService { get; }
    public Mock<ICountryService> CountryService { get; }
    public Mock<ReferralLinkSearchFilterValidator> ReferralLinkSearchFilterValidator { get; }
    public Mock<ReferralLinkRequestCreateValidator> ReferralLinkRequestCreateValidator { get; }
    public Mock<ReferralLinkRequestUpdateValidator> ReferralLinkRequestUpdateValidator { get; }
    public Mock<IRepositoryBatchedValueContainsWithNavigation<ReferralLink>> LinkRepository { get; }
    #endregion

    #region Constructor
    public LinkServiceFixture(string username = "testuser@example.com", params string[] roles)
    {
      Logger = new Mock<ILogger<LinkService>>();

      AppSettings = new AppSettings
      {
        AppBaseURL = "https://app.test.com"
      };
      AppSettingsOptions = new Mock<IOptions<AppSettings>>();
      AppSettingsOptions.Setup(x => x.Value).Returns(AppSettings);

      HttpContextAccessor = MockHttpContextAccessor.Create(username, roles);

      ShortLinkProviderClient = new Mock<IShortLinkProviderClient>();
      ShortLinkProviderClient
        .Setup(x => x.CreateShortLink(It.IsAny<ShortLinkRequest>()))
        .ReturnsAsync(new ShortLinkResponse { Id = "test", Link = "https://short.link/abc" });

      ShortLinkProviderClientFactory = new Mock<IShortLinkProviderClientFactory>();
      ShortLinkProviderClientFactory
        .Setup(x => x.CreateClient())
        .Returns(ShortLinkProviderClient.Object);

      UserService = new Mock<IUserService>();
      ProgramInfoService = new Mock<IProgramInfoService>();

      LinkStatusService = MockLookupServices.CreateLinkStatusService();
      LinkUsageStatusService = MockLookupServices.CreateLinkUsageStatusService();

      CountryService = new Mock<ICountryService>();

      ReferralLinkSearchFilterValidator = new Mock<ReferralLinkSearchFilterValidator>() { CallBase = false };
      ReferralLinkRequestCreateValidator = new Mock<ReferralLinkRequestCreateValidator>() { CallBase = false };
      ReferralLinkRequestUpdateValidator = new Mock<ReferralLinkRequestUpdateValidator>() { CallBase = false };

      LinkRepository = new Mock<IRepositoryBatchedValueContainsWithNavigation<ReferralLink>>();
      SetupRepository(LinkRepository);
    }
    #endregion

    #region Public Members
    public LinkService Build()
    {
      return new LinkService(
        Logger.Object,
        AppSettingsOptions.Object,
        HttpContextAccessor.Object,
        ShortLinkProviderClientFactory.Object,
        UserService.Object,
        ProgramInfoService.Object,
        LinkStatusService.Object,
        LinkUsageStatusService.Object,
        CountryService.Object,
        ReferralLinkSearchFilterValidator.Object,
        ReferralLinkRequestCreateValidator.Object,
        ReferralLinkRequestUpdateValidator.Object,
        LinkRepository.Object);
    }
    #endregion

    #region Private Members
    private static void SetupRepository<T>(Mock<IRepositoryBatchedValueContainsWithNavigation<T>> mock) where T : class
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
