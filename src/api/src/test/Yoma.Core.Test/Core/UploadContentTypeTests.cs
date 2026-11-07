using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.BlobProvider.Interfaces;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Domain.Core.Validators;

namespace Yoma.Core.Test.Core
{
  public class UploadContentTypeTests
  {
    [Theory]
    [InlineData("png", "image/")]
    [InlineData("jpg", "image/")]
    [InlineData("jpeg", "image/")]
    [InlineData("webp", "image/")]
    [InlineData("pdf", "application/pdf")]
    [InlineData("doc", "application/msword")]
    [InlineData("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")]
    [InlineData("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation")]
    [InlineData("wav", "audio/")]
    [InlineData("mp3", "audio/")]
    [InlineData("m4a", "audio/")]
    [InlineData("amr", "audio/")]
    [InlineData("ogg", "audio/")]
    [InlineData("3gp", "video/")]
    [InlineData("mp4", "video/")]
    [InlineData("mov", "video/")]
    [InlineData("avi", "video/")]
    [InlineData("mkv", "video/")]
    [InlineData("wmv", "video/")]
    [InlineData("webm", "video/")]
    [InlineData("flv", "video/")]
    [InlineData("m4v", "video/")]
    [InlineData("zip", "application/zip")]
    [InlineData("csv", "text/csv")]
    public void SupportedExtensionsRetainAppropriateResponseTypes(string extension, string expectedPrefix)
    {
      var filename = $"evidence.{extension}";
      FileValidator.Validate(filename, 3);

      var contentType = FileHelper.GetContentType(filename);

      Assert.StartsWith(expectedPrefix, contentType, StringComparison.OrdinalIgnoreCase);
      Assert.Equal(contentType, FileHelper.GetContentType(filename.ToUpperInvariant()));
    }

    [Fact]
    public void SharedContainerExtensionUsesTheAttachmentCategory()
    {
      Assert.Equal("audio/3gpp", FileHelper.GetContentType("evidence.3gp", type: FileType.VoiceNotes));
      Assert.Equal("video/3gpp", FileHelper.GetContentType("evidence.3gp", type: FileType.Videos));
      Assert.Equal("application/octet-stream", FileHelper.GetContentType("evidence.unknown"));
    }

    [Theory]
    [InlineData("evidence.png", "image/png", "image/png")]
    [InlineData("evidence.jpg", "image/jpg", "image/jpg")]
    [InlineData("evidence.wav", "audio/x-wav", "audio/x-wav")]
    [InlineData("evidence.3gp", "audio/3gpp", "audio/3gpp")]
    [InlineData("evidence.3gp", "video/3gpp", "video/3gpp")]
    [InlineData("evidence.csv", "application/vnd.ms-excel", "application/vnd.ms-excel")]
    [InlineData("evidence.webm", "video/webm; codecs=vp9", "video/webm; codecs=vp9")]
    [InlineData("evidence.png", "text/html", "image/png")]
    [InlineData("evidence.png", "image/svg+xml", "image/png")]
    [InlineData("evidence.pdf", "application/javascript", "application/pdf")]
    [InlineData("evidence.png", "application/octet-stream", "image/png")]
    [InlineData("evidence.png", null, "image/png")]
    [InlineData("evidence.png", "", "image/png")]
    [InlineData("evidence.png", "not a MIME type", "image/png")]
    public void SuppliedTypesAreRetainedOnlyWhenCompatibleWithTheExtension(string filename, string? supplied, string expected)
    {
      Assert.Equal(expected, FileHelper.GetContentType(filename, supplied));
    }

    [Fact]
    public void ExtensionlessAttachmentsRemainRejectedByExistingValidation()
    {
      Assert.Throws<Domain.Core.Exceptions.BusinessException>(() => FileValidator.Validate("evidence", 3));
    }

    [Fact]
    public async Task MultipartUploadUsesTheServerTypeForTheRecordAndStorage()
    {
      var repository = new Mock<IRepository<BlobObject>>();
      repository.Setup(service => service.Create(It.IsAny<BlobObject>())).ReturnsAsync((BlobObject item) => item);
      var provider = new Mock<IBlobProviderClient>();
      var factory = new Mock<IBlobProviderClientFactory>();
      factory.Setup(service => service.CreateClient(StorageType.Private)).Returns(provider.Object);
      var strategy = new Mock<IExecutionStrategyService>();
      strategy.Setup(service => service.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), false))
        .Returns((Func<Task> action, bool _) => action());
      var service = new BlobService(Mock.Of<IEnvironmentProvider>(), factory.Object, repository.Object,
        strategy.Object, Mock.Of<IResumableUploadStore>());
      using var stream = new MemoryStream([1, 2, 3]);
      var file = new FormFile(stream, 0, stream.Length, "file", "evidence.png")
      {
        Headers = new HeaderDictionary(),
        ContentType = "text/html"
      };

      // This test checks response metadata only; it does not claim to validate image bytes.
      var result = await service.Create(FileType.Photos, StorageType.Private, file, null);

      Assert.Equal("image/png", result.ContentType);
      provider.Verify(client => client.Create(It.IsAny<string>(), "image/png", It.IsAny<byte[]>()), Times.Once);
    }
  }
}
