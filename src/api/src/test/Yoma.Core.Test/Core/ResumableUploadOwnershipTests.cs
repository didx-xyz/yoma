using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using Xunit;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.BlobProvider.Interfaces;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Services;
using Yoma.Core.Infrastructure.AmazonS3;
using Yoma.Core.Infrastructure.AmazonS3.Models;
using Yoma.Core.Infrastructure.AmazonS3.Services;

namespace Yoma.Core.Test.Core
{
  public class ResumableUploadOwnershipTests
  {
    #region Tests
    [Theory]
    [InlineData("HEAD")]
    [InlineData("PATCH")]
    [InlineData("DELETE")]
    public async Task AnotherAuthenticatedUserCannotAccessAnUpload(string method)
    {
      await using var fixture = await Fixture.Start();
      var id = await fixture.Create();

      using var response = await fixture.Send(method, id, Guid.NewGuid());

      Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
      Assert.Equal(0, await fixture.Store.GetUploadOffsetAsync(id, CancellationToken.None));
      fixture.S3.Verify(client => client.DeleteObjectAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task OwnershipSurvivesRefreshContactChangesAndAnotherApiInstance()
    {
      await using var fixture = await Fixture.Start();
      var id = await fixture.Create();
      using var firstPatch = await fixture.Send("PATCH", id, fixture.Owner, data: [1]);
      Assert.Equal(HttpStatusCode.NoContent, firstPatch.StatusCode);
      using var head = await fixture.Send("HEAD", id, fixture.Owner, mappedSubject: true);
      Assert.Equal(HttpStatusCode.OK, head.StatusCode);
      Assert.Equal("1", Assert.Single(head.Headers.GetValues("Upload-Offset")));
      using var patch = await fixture.Send("PATCH", id, fixture.Owner, mappedSubject: true, data: [2, 3], offset: 1);
      Assert.Equal(HttpStatusCode.NoContent, patch.StatusCode);

      // A fresh API instance can recover the server-owned identity from S3 after cache eviction.
      fixture.Cache.Clear();
      fixture.SetUser(fixture.Owner, true);
      var store = fixture.CreateStore();
      var info = await fixture.CreateUploadService(store).GetInfo(id);

      Assert.Equal("evidence.png", info.OriginalFileName);
      Assert.Equal(3, info.Length);
      Assert.Equal(fixture.Owner, Guid.Parse(JObject.Parse(fixture.Objects[$"test/upload-info/{id}"]).Value<string>("OwnerId")!));
      using var delete = await fixture.Send("DELETE", id, fixture.Owner, mappedSubject: true);
      Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
    }

    [Fact]
    public async Task AttachmentChecksUploaderBeforeCopyingAndAllowsAnAdministratorToUploadEvidence()
    {
      await using var fixture = await Fixture.Start();
      var id = await fixture.Create($",contentType {Convert.ToBase64String(Encoding.UTF8.GetBytes("text/html"))}");
      using var patch = await fixture.Send("PATCH", id, fixture.Owner);
      Assert.Equal(HttpStatusCode.NoContent, patch.StatusCode);
      var repository = new Mock<IRepository<BlobObject>>();
      repository.Setup(service => service.Create(It.IsAny<BlobObject>())).ReturnsAsync((BlobObject item) => item);
      var provider = new Mock<IBlobProviderClient>();
      var factory = new Mock<IBlobProviderClientFactory>();
      factory.Setup(service => service.CreateClient(StorageType.Private)).Returns(provider.Object);
      var strategy = new Mock<IExecutionStrategyService>();
      strategy.Setup(service => service.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), false))
        .Returns((Func<Task> action, bool _) => action());
      var service = new BlobService(fixture.Environment.Object, factory.Object, repository.Object,
        strategy.Object, fixture.CreateUploadService(fixture.Store));

      fixture.SetUser(Guid.NewGuid(), true);
      await Assert.ThrowsAsync<SecurityException>(() => service.Create(FileType.Photos, StorageType.Private, null, id));
      repository.Verify(service => service.Create(It.IsAny<BlobObject>()), Times.Never);
      provider.VerifyNoOtherCalls();

      fixture.SetUser(fixture.Owner, true); // Upload ownership is independent of the eventual participant receiving the evidence.
      var result = await service.Create(FileType.Photos, StorageType.Private, null, id);
      Assert.Equal("evidence.png", result.OriginalFileName);
      Assert.Equal("image/png", result.ContentType);
      provider.Verify(client => client.Create(It.IsAny<string>(), "image/png", "test-bucket", $"local/test/files/{id}"), Times.Once);
    }

    [Theory]
    [InlineData("contentType")]
    [InlineData("filetype")]
    public async Task UploadMetadataCannotSelectAnExecutableResponseType(string metadataKey)
    {
      await using var fixture = await Fixture.Start();
      var id = await fixture.Create($",{metadataKey} {Convert.ToBase64String(Encoding.UTF8.GetBytes("text/html"))}");
      using var patch = await fixture.Send("PATCH", id, fixture.Owner);
      Assert.Equal(HttpStatusCode.NoContent, patch.StatusCode);
      fixture.SetUser(fixture.Owner);

      var info = await fixture.CreateUploadService(fixture.Store).GetInfo(id);

      Assert.Equal("image/png", info.ContentType);
    }

    [Theory]
    [InlineData("contentType")]
    [InlineData("filetype")]
    public async Task SupportedBrowserMimeAliasesArePreserved(string metadataKey)
    {
      await using var fixture = await Fixture.Start();
      var id = await fixture.Create($",{metadataKey} {Convert.ToBase64String(Encoding.UTF8.GetBytes("image/x-png"))}");
      using var patch = await fixture.Send("PATCH", id, fixture.Owner);
      Assert.Equal(HttpStatusCode.NoContent, patch.StatusCode);
      fixture.SetUser(fixture.Owner);

      var info = await fixture.CreateUploadService(fixture.Store).GetInfo(id);

      Assert.Equal("image/x-png", info.ContentType);
    }

    [Fact]
    public async Task ClientMetadataCannotChooseTheOwnerAndLegacyUploadsFailClosed()
    {
      await using var fixture = await Fixture.Start();
      var other = Guid.NewGuid();
      var id = await fixture.Create($",OwnerId {Convert.ToBase64String(Encoding.UTF8.GetBytes(other.ToString()))}");
      var metadata = JObject.Parse(fixture.Objects[$"test/upload-info/{id}"]);
      Assert.Equal(fixture.Owner, Guid.Parse(metadata.Value<string>("OwnerId")!));
      fixture.SetUser(other);
      await Assert.ThrowsAsync<SecurityException>(() => fixture.Store.GetOwnedFileAsync(id, CancellationToken.None));

      // Old metadata has no server-owned field; a similarly named client field must not grant ownership.
      metadata.Remove("OwnerId");
      fixture.Objects[$"test/upload-info/{id}"] = metadata.ToString();
      fixture.Cache.Clear();
      using var response = await fixture.Send("HEAD", id, other);
      Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
      await Assert.ThrowsAsync<SecurityException>(() => fixture.CreateUploadService(fixture.Store).GetInfo(id));
    }

    [Fact]
    public async Task CreationRequiresAuthenticationAndAStableSubject()
    {
      await using var fixture = await Fixture.Start();
      using var anonymous = await fixture.Send("POST", null, null);
      Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
      using var invalid = await fixture.Send("POST", null, Guid.Empty);
      Assert.Equal(HttpStatusCode.Forbidden, invalid.StatusCode);
      Assert.Empty(fixture.Objects);
    }

    [Fact]
    public async Task BackgroundCleanupDoesNotRequireAUserSession()
    {
      await using var fixture = await Fixture.Start();
      var id = await fixture.Create();
      fixture.Accessor.HttpContext = null;

      await fixture.CreateUploadService(fixture.Store).Delete(id);

      fixture.S3.Verify(client => client.DeleteObjectAsync("test-bucket", $"test/upload-info/{id}", It.IsAny<CancellationToken>()), Times.Once);
    }
    #endregion

    #region Fixture
    private sealed class Fixture : IAsyncDisposable
    {
      private WebApplication _app = null!;
      private HttpClient _client = null!;
      internal Guid Owner { get; } = Guid.NewGuid();
      internal HttpContextAccessor Accessor { get; } = new();
      internal MemoryCache Cache { get; } = new();
      internal ConcurrentDictionary<string, string> Objects { get; } = new();
      internal Mock<IAmazonS3> S3 { get; } = new();
      internal Mock<IEnvironmentProvider> Environment { get; } = new();
      internal BufferedTusS3Store Store { get; private set; } = null!;

      private Fixture()
      {
        Environment.Setup(provider => provider.Environment).Returns(Domain.Core.Environment.Local);
        S3.Setup(client => client.PutObjectAsync(It.IsAny<PutObjectRequest>(), It.IsAny<CancellationToken>()))
          .ReturnsAsync((PutObjectRequest request, CancellationToken _) =>
          {
            if (request.ContentBody != null) Objects[request.Key] = request.ContentBody;
            return new PutObjectResponse();
          });
        S3.Setup(client => client.GetObjectAsync(It.IsAny<GetObjectRequest>(), It.IsAny<CancellationToken>()))
          .ReturnsAsync((GetObjectRequest request, CancellationToken _) => new GetObjectResponse
          {
            ResponseStream = new MemoryStream(Encoding.UTF8.GetBytes(Objects[request.Key]))
          });
        S3.Setup(client => client.GetObjectMetadataAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
          .ReturnsAsync((string _, string key, CancellationToken _) =>
          {
            var response = new GetObjectMetadataResponse();
            response.Metadata["x-amz-meta-tus-upload-offset"] = (JObject.Parse(Objects[key]).Value<long?>("UploadOffset") ?? 0).ToString();
            return response;
          });
        S3.Setup(client => client.CopyObjectAsync(It.IsAny<CopyObjectRequest>(), It.IsAny<CancellationToken>()))
          .ReturnsAsync(new CopyObjectResponse());
        S3.Setup(client => client.DeleteObjectAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
          .ReturnsAsync(new DeleteObjectResponse());
      }

      internal static async Task<Fixture> Start()
      {
        var fixture = new Fixture();
        var builder = WebApplication.CreateSlimBuilder();
        builder.Configuration.Sources.Clear();
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
          ["AWSS3:Tus:UrlPath"] = "/uploads",
          ["AWSS3:Tus:ExpirationMinutes"] = "60"
        });
        builder.Logging.ClearProviders();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Services.AddSingleton<IHttpContextAccessor>(fixture.Accessor);
        fixture.Store = fixture.CreateStore();
        builder.Services.AddSingleton(fixture.Store);
        builder.Services.AddAuthentication("test").AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>("test", _ => { });
        builder.Services.AddAuthorization(options => options.AddPolicy("upload", policy => policy.RequireAuthenticatedUser()));
        fixture._app = builder.Build();
        fixture._app.UseAuthentication();
        fixture._app.UseAuthorization();
        fixture._app.MapResumableUploadEndpoints(builder.Configuration, "upload");
        await fixture._app.StartAsync();
        fixture._client = new HttpClient { BaseAddress = new Uri(fixture._app.Urls.Single()) };
        return fixture;
      }

      internal BufferedTusS3Store CreateStore()
      {
        var locks = new Mock<IDistributedLockService>();
        locks.Setup(service => service.RunWithLockAsync(It.IsAny<string>(), It.IsAny<TimeSpan>(), It.IsAny<Func<Task<long>>>(), It.IsAny<string>()))
          .Returns((string _, TimeSpan _, Func<Task<long>> action, string _) => action());
        return new BufferedTusS3Store(NullLogger<BufferedTusS3Store>.Instance, Cache, locks.Object, S3.Object,
          Accessor, "test-bucket", "test/files/", "test/upload-info/", 5 * 1024 * 1024, 60);
      }

      internal TusResumableUploadStoreService CreateUploadService(BufferedTusS3Store store) => new(Environment.Object,
        Options.Create(new AWSS3Options
        {
          Tus = new AWSS3OptionsTus { KeyPrefix = "test" },
          Buckets = new() { [StorageType.Private] = new AWSS3OptionsBucket { BucketName = "test-bucket" } }
        }), store);

      internal void SetUser(Guid subject, bool mappedSubject = false) => Accessor.HttpContext = new DefaultHttpContext
      {
        User = Principal(subject.ToString(), mappedSubject)
      };

      internal async Task<string> Create(string metadata = "")
      {
        using var response = await Send("POST", null, Owner, metadata: metadata);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return response.Headers.Location!.ToString().Split('/').Last();
      }

      internal async Task<HttpResponseMessage> Send(string method, string? id, Guid? subject, bool mappedSubject = false,
        string metadata = "", byte[]? data = null, long offset = 0)
      {
        using var request = new HttpRequestMessage(new HttpMethod(method), id == null ? "/uploads" : $"/uploads/{id}");
        request.Headers.Add("Tus-Resumable", "1.0.0");
        if (subject.HasValue) request.Headers.Add("X-Test-Subject", subject.Value.ToString());
        if (mappedSubject) request.Headers.Add("X-Test-Mapped", "true");
        if (method == "POST")
        {
          request.Headers.Add("Upload-Length", "3");
          request.Headers.Add("Upload-Metadata", $"filename {Convert.ToBase64String(Encoding.UTF8.GetBytes("evidence.png"))}{metadata}");
        }
        if (method == "PATCH")
        {
          request.Headers.Add("Upload-Offset", offset.ToString());
          request.Content = new ByteArrayContent(data ?? [1, 2, 3]);
          request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/offset+octet-stream");
        }
        return await _client.SendAsync(request);
      }

      public async ValueTask DisposeAsync()
      {
        _client.Dispose();
        await _app.DisposeAsync();
      }
    }

    private static ClaimsPrincipal Principal(string subject, bool mapped) => new(new ClaimsIdentity([
      new Claim(mapped ? ClaimTypes.NameIdentifier : "sub", subject),
      new Claim(ClaimTypes.Name, mapped ? "updated@example.org" : "+27820000000"),
      new Claim(ClaimTypes.Role, mapped ? Constants.Role_Admin : Constants.Role_User)], "test"));

    private sealed class TestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
      : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
      protected override Task<AuthenticateResult> HandleAuthenticateAsync()
      {
        var subject = Request.Headers["X-Test-Subject"].ToString();
        return Task.FromResult(string.IsNullOrEmpty(subject) ? AuthenticateResult.NoResult() :
          AuthenticateResult.Success(new AuthenticationTicket(Principal(subject, Request.Headers.ContainsKey("X-Test-Mapped")), Scheme.Name)));
      }
    }

    // Serialize values like the distributed cache so separate store instances cannot share mutable metadata by reference.
    private sealed class MemoryCache : IDistributedCacheService
    {
      private readonly ConcurrentDictionary<string, string> _items = new();
      public Task<T?> GetAsync<T>(string key) where T : class => Task.FromResult(_items.TryGetValue(key, out var value) ? JsonConvert.DeserializeObject<T>(value) : null);
      public Task SetAsync<T>(string key, T value, TimeSpan? absoluteExpirationRelativeToNow = null) where T : class
      {
        _items[key] = JsonConvert.SerializeObject(value);
        return Task.CompletedTask;
      }
      public void Remove(string key) => _items.TryRemove(key, out _);
      public Task RemoveAsync(string key) { Remove(key); return Task.CompletedTask; }
      public void Clear() => _items.Clear();
      public T GetOrCreate<T>(string key, Func<T> valueProvider, TimeSpan? slidingExpiration = null, TimeSpan? absoluteExpirationRelativeToNow = null) where T : class => throw new NotSupportedException();
      public Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> valueProvider, TimeSpan? slidingExpiration = null, TimeSpan? absoluteExpirationRelativeToNow = null) where T : class => throw new NotSupportedException();
    }
    #endregion
  }
}
