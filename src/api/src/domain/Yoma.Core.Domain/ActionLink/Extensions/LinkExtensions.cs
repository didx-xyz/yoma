using Yoma.Core.Domain.ActionLink.Models;

namespace Yoma.Core.Domain.ActionLink.Extensions
{
  public static class LinkExtensions
  {
    public static LinkInfo ToLinkInfo(this Link value, string? qrCodeBase64)
    {
      ArgumentNullException.ThrowIfNull(value, nameof(value));

      return new LinkInfo
      {
        Id = value.Id,
        Name = value.Name,
        Description = value.Description,
        StatusId = value.StatusId,
        Status = value.Status,
        URL = value.URL,
        ShortURL = value.ShortURL,
        QRCodeBase64 = qrCodeBase64,
        ParticipantLimit = value.ParticipantLimit,
        ParticipantCount = value.ParticipantCount,
        DateEnd = value.DateEnd,
        DateCreated = value.DateCreated,
        DateModified = value.DateModified
      };
    }
  }
}
