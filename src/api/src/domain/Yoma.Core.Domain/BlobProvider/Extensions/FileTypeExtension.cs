using Yoma.Core.Domain.Core;

namespace Yoma.Core.Domain.BlobProvider.Extensions
{
  public static class FileTypeExtension
  {
    public static StorageType ToStorageType(this FileType fileType)
    {
      return fileType switch
      {
        FileType.Photos => StorageType.Public,
        _ => StorageType.Private
      };
    }
  }
}
