namespace Yoma.Core.Domain.Referral.Interfaces.Lookups
{
  public interface IReferralProgramStatusService
  {
    Models.Lookups.ProgramStatus GetByName(string name);

    Models.Lookups.ProgramStatus? GetByNameOrNull(string name);

    Models.Lookups.ProgramStatus GetById(Guid id);

    Models.Lookups.ProgramStatus? GetByIdOrNull(Guid id);

    List<Models.Lookups.ProgramStatus> List();
  }
}
