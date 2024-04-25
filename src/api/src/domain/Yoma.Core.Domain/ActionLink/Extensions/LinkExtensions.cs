using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core.Helpers;

namespace Yoma.Core.Domain.ActionLink.Extensions
{
  public static class LinkExtensions
  {
    public static LinkInfo ToLinkInfo(this Link value, bool? includeQRCode)
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
        QRCodeBase64 = includeQRCode == true ? QRCodeHelper.GenerateQRCodeBase64(value.ShortURL) : null,
        UsagesLimit = value.UsagesLimit,
        UsagesTotal = value.UsagesTotal,
        UsagesAvailable = value.UsagesLimit.HasValue ? value.UsagesLimit - (value.UsagesTotal ?? 0) : null,
        DateEnd = value.DateEnd,
        DateCreated = value.DateCreated,
        DateModified = value.DateModified
      };
    }
  }
}
