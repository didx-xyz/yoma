using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Entity.Models
{
  public class OrganizationRequestCreate : OrganizationRequestBase
  {
    [Required]
    public new List<IFormFile> RegistrationDocuments { get; set; } = null!;

    /// <summary>
    /// Optional initial pool, restricted to system administrators. Existing pools are changed
    /// through the separate reward-pool endpoint.
    /// </summary>
    public decimal? ZltoRewardPoolCurrentFinancialYear { get; set; }
  }
}
