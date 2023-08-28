using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Exceptions;

namespace Yoma.Core.Domain.Core.Validators
{
    public class FileValidator
    {
        #region Class Variables
        private readonly string[] extensions;
        private readonly int maxSizeBytes;
        #endregion

        #region Public Members
        public FileValidator(FileType type)
        {
            switch (type)
            {
                case FileType.Photos:
                    extensions = new[] { ".png", ".jpg", ".jpeg", ".svg", ".webp" };
                    maxSizeBytes = 5000000;
                    break;

                case FileType.Certificates:
                    extensions = new[] { ".pdf" };
                    maxSizeBytes = 10000000;
                    break;

                case FileType.Documents:
                    extensions = new[] { ".pdf", ".doc", ".docx", ".pptx" };
                    maxSizeBytes = 10000000;
                    break;

                default:
                    throw new ArgumentOutOfRangeException(nameof(type), $"Unsupported type of '{type}'");
            }
        }

        public void Validate(IFormFile file)
        {
            if (file == null)
                throw new ArgumentNullException(nameof(file));

            if (!extensions.Contains(FileHelper.GetExtension(file), StringComparer.InvariantCultureIgnoreCase))
                throw new BusinessException($"Only supports file formats '{string.Join(", ", extensions)}'");

            if (file.Length > maxSizeBytes)
                throw new BusinessException($"Only supports file size smaller or equal to '{Math.Round((decimal)maxSizeBytes / 1000000, 2)}MB'");
        }
        #endregion
    }
}
