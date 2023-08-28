using Microsoft.AspNetCore.Http;

namespace Yoma.Core.Domain.Core.Helpers
{
    public static class FileHelper
    {
        public static byte[] ToBinary(this IFormFile file)
        {
            using (var binaryReader = new BinaryReader(file.OpenReadStream()))
            {
                return binaryReader.ReadBytes((int)file.Length);
            }
        }

        public static string GetExtension(this IFormFile file)
        {
            return Path.GetExtension(file.FileName);
        }

        public static IFormFile FromByteArray(string fileName, string contentType, byte[] data)
        {
            if (string.IsNullOrWhiteSpace(fileName))
                throw new ArgumentNullException(nameof(fileName));
            fileName = fileName.Trim();

            if (data == null || data.Length == 0)
                throw new ArgumentNullException(nameof(data));

            var result = new FormFile(new MemoryStream(data), 0, data.Length, Path.GetFileNameWithoutExtension(fileName), fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType
            };
            result.ContentDisposition = new System.Net.Mime.ContentDisposition() { FileName = fileName }.ToString();

            return result;
        }
    }
}
