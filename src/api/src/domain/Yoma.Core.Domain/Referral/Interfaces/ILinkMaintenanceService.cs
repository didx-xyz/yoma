using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface ILinkMaintenanceService
  {
    Task CancelByUserId(Guid userId);

    Task CancelByProgramId(Guid programId);
  }
}
