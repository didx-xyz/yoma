using Moq;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Test.Referral.Builders;

namespace Yoma.Core.Test.Referral.Fixtures
{
  public static class MockLookupServices
  {
    public static Mock<ILinkStatusService> CreateLinkStatusService()
    {
      var mock = new Mock<ILinkStatusService>();
      mock.Setup(x => x.GetByName("Active")).Returns(LookupBuilder.LinkStatusActive);
      mock.Setup(x => x.GetByName("Cancelled")).Returns(LookupBuilder.LinkStatusCancelled);
      mock.Setup(x => x.GetByName("LimitReached")).Returns(LookupBuilder.LinkStatusLimitReached);
      mock.Setup(x => x.GetByName("Expired")).Returns(LookupBuilder.LinkStatusExpired);
      return mock;
    }

    public static Mock<ILinkUsageStatusService> CreateLinkUsageStatusService()
    {
      var mock = new Mock<ILinkUsageStatusService>();
      mock.Setup(x => x.GetByName("Pending")).Returns(LookupBuilder.UsageStatusPending);
      mock.Setup(x => x.GetByName("Completed")).Returns(LookupBuilder.UsageStatusCompleted);
      mock.Setup(x => x.GetByName("Expired")).Returns(LookupBuilder.UsageStatusExpired);
      return mock;
    }

    public static Mock<IProgramStatusService> CreateProgramStatusService()
    {
      var mock = new Mock<IProgramStatusService>();
      mock.Setup(x => x.GetByName("Active")).Returns(LookupBuilder.ProgramStatusActive);
      mock.Setup(x => x.GetByName("Inactive")).Returns(LookupBuilder.ProgramStatusInactive);
      mock.Setup(x => x.GetByName("Expired")).Returns(LookupBuilder.ProgramStatusExpired);
      mock.Setup(x => x.GetByName("LimitReached")).Returns(LookupBuilder.ProgramStatusLimitReached);
      mock.Setup(x => x.GetByName("UnCompletable")).Returns(LookupBuilder.ProgramStatusUnCompletable);
      mock.Setup(x => x.GetByName("Deleted")).Returns(LookupBuilder.ProgramStatusDeleted);
      return mock;
    }

    public static Mock<IBlockReasonService> CreateBlockReasonService()
    {
      var mock = new Mock<IBlockReasonService>();
      mock.Setup(x => x.GetById(LookupBuilder.BlockReasonOtherId)).Returns(LookupBuilder.BlockReasonOther);
      mock.Setup(x => x.GetByIdOrNull(LookupBuilder.BlockReasonOtherId)).Returns(LookupBuilder.BlockReasonOther);
      mock.Setup(x => x.List()).Returns([LookupBuilder.BlockReasonOther]);
      return mock;
    }
  }
}
