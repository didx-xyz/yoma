using QRCoder;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class QRCodeHelper
  {
    public static string GenerateQRCodeBase64(string url, QRCodeGenerator.ECCLevel ecc = QRCodeGenerator.ECCLevel.Q, int pixelsPerModule = 20)
    {
      using var qrGenerator = new QRCodeGenerator();
      var qrCodeData = qrGenerator.CreateQrCode(url, ecc);

      using var qrCode = new PngByteQRCode(qrCodeData);
      var qrCodeAsBytes = qrCode.GetGraphic(pixelsPerModule);

      var base64String = Convert.ToBase64String(qrCodeAsBytes);
      return $"data:image/png;base64,{base64String}";
    }
  }
}
