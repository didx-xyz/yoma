using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityVerification
  {
    public Guid Id { get; set; }

    public Guid MyOpportunityId { get; set; }

    [JsonIgnore]
    public string UserDisplayName { get; set; } = null!;

    public Guid VerificationTypeId { get; set; }

    public VerificationType VerificationType { get; set; }

    /// <summary>
    /// Readable type of evidence actually submitted, without its file URL or geometry.
    /// The opportunity's configured list of permitted evidence is not a substitute for this value.
    /// </summary>
    [JsonIgnore]
    public string VerificationTypeDisplayName => VerificationType.ToDescription();

    public string? GeometryProperties { get; set; }

    public Geometry? Geometry { get; set; }

    public Guid? FileId { get; set; }

    [JsonIgnore]
    public StorageType? FileStorageType { get; set; }

    [JsonIgnore]
    public string? FileKey { get; set; }

    public string? FileURL { get; set; }

    public IFormFile? File { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
