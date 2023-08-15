using Yoma.Core.Domain.LaborMarketProvider.Models;

namespace Yoma.Core.Domain.LaborMarketProvider.Interfaces
{
  public interface ILaborMarketProviderClient
  {
    Task<List<Skill>?> ListSkills();

    Task<List<JobTitle>?> ListJobTitles();
  }
}
