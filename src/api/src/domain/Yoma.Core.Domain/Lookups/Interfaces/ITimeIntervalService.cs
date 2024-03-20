using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Interfaces
{
  public interface ITimeIntervalService
  {
    TimeInterval GetByName(string name);

    TimeInterval? GetByNameOrNull(string name);

    TimeInterval GetById(Guid id);

    TimeInterval? GetByIdOrNull(Guid id);

    List<TimeInterval> List();
  }
}
