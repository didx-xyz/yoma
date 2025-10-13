using Yoma.Core.Domain.Referral.Models.Lookups;

namespace Yoma.Core.Domain.Referral.Interfaces.Lookups
{
  public interface IReferralProgramStatusService
  {
    ReferralProgramStatus GetByName(string name);

    ReferralProgramStatus? GetByNameOrNull(string name);

    ReferralProgramStatus GetById(Guid id);

    ReferralProgramStatus? GetByIdOrNull(Guid id);

    List<ReferralProgramStatus> List();
  }
}
