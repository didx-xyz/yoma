using Microsoft.AspNetCore.Http;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class FileHelper
  {
    public static byte[] ToBinary(this IFormFile file)
    {
      using (var binaryReader = new BinaryReader(file.OpenReadStream()))
      {
        return binaryReader.ReadBytes((int) file.Length);
      }
    }

    public static string GetExtension(this IFormFile file)
    {
      return Path.GetExtension(file.FileName);
    }
  }
}
