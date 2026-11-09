using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Logging;
using Moq;
using System.Net.Mime;
using System.Reflection;
using System.Text.Json;
using Xunit;
using Yoma.Core.Api.Middleware;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Test.Core
{
  public class BadHttpRequestTests
  {
    #region Tests
    [Theory]
    [InlineData(400, false, LogLevel.Information)]
    [InlineData(413, false, LogLevel.Information)]
    [InlineData(503, false, LogLevel.Error)]
    [InlineData(400, true, LogLevel.Information)]
    [InlineData(413, true, LogLevel.Information)]
    [InlineData(503, true, LogLevel.Error)]
    public async Task RequestFailurePreservesStatusAndEnvelopeWithAppropriateDiagnostics(int status, bool kestrel, LogLevel level)
    {
      var exception = CreateRequestException(status, kestrel);
      var context = new DefaultHttpContext();
      using var body = new MemoryStream();
      context.Response.Body = body;
      var logger = CreateLogger();

      await CreatePipeline(exception, logger).InvokeAsync(context);

      Assert.Equal(status, context.Response.StatusCode);
      Assert.StartsWith(MediaTypeNames.Application.Json, context.Response.ContentType);
      body.Position = 0;
      var errors = await JsonSerializer.DeserializeAsync<List<ErrorResponseItem>>(body,
        JsonSerializerOptions.Web, TestContext.Current.CancellationToken);
      var error = Assert.Single(Assert.IsType<List<ErrorResponseItem>>(errors));
      Assert.Equal(exception.GetType().Name, error.Type);
      Assert.Equal(exception.Message, error.Message);
      AssertLog(logger, exception, level, status);
    }

    [Fact]
    public async Task UnexpectedFailureRemainsErrorAndInternalServerError()
    {
      var exception = new InvalidOperationException("Unexpected failure");
      var context = new DefaultHttpContext();
      using var body = new MemoryStream();
      context.Response.Body = body;
      var logger = CreateLogger();

      await CreatePipeline(exception, logger).InvokeAsync(context);

      Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
      body.Position = 0;
      var errors = await JsonSerializer.DeserializeAsync<List<ErrorResponseItem>>(body,
        JsonSerializerOptions.Web, TestContext.Current.CancellationToken);
      var error = Assert.Single(Assert.IsType<List<ErrorResponseItem>>(errors));
      Assert.Equal(nameof(InvalidOperationException), error.Type);
      Assert.Equal(exception.Message, error.Message);
      AssertLog(logger, exception, LogLevel.Error, StatusCodes.Status500InternalServerError);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task StartedResponseRethrowsOriginalFailureWithoutRewriting(bool unexpected)
    {
      Exception exception = unexpected ? new InvalidOperationException("Unexpected failure") : CreateRequestException();
      using var body = new MemoryStream([1, 2, 3]);
      var response = new Mock<IHttpResponseFeature>();
      response.SetupGet(value => value.HasStarted).Returns(true);
      response.SetupGet(value => value.StatusCode).Returns(StatusCodes.Status202Accepted);
      response.SetupGet(value => value.Headers).Returns(new HeaderDictionary());
      var context = new DefaultHttpContext();
      context.Features.Set(response.Object);
      context.Features.Set<IHttpResponseBodyFeature>(new StreamResponseBodyFeature(body));
      var logger = CreateLogger();

      var actual = await Record.ExceptionAsync(() => CreatePipeline(exception, logger).InvokeAsync(context));

      Assert.Same(exception, actual);
      response.VerifySet(value => value.StatusCode = It.IsAny<int>(), Times.Never);
      Assert.Empty(response.Object.Headers);
      Assert.Equal(new byte[] { 1, 2, 3 }, body.ToArray());
      AssertLog(logger, exception, unexpected ? LogLevel.Error : LogLevel.Information, unexpected ? 500 : 400);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task DisconnectedRequestKeepsDiagnosticsWithoutWritingResponse(bool unexpected)
    {
      Exception exception = unexpected ? new InvalidOperationException("Unexpected failure") : CreateRequestException();
      using var cancellation = new CancellationTokenSource();
      await cancellation.CancelAsync();
      var context = new DefaultHttpContext { RequestAborted = cancellation.Token };
      using var body = new MemoryStream();
      context.Response.Body = body;
      context.Response.StatusCode = StatusCodes.Status202Accepted;
      var logger = CreateLogger();

      await CreatePipeline(exception, logger).InvokeAsync(context);

      Assert.Equal(StatusCodes.Status202Accepted, context.Response.StatusCode);
      Assert.Null(context.Response.ContentType);
      Assert.Equal(0, body.Length);
      AssertLog(logger, exception, unexpected ? LogLevel.Error : LogLevel.Information, unexpected ? 500 : 400);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task DisconnectionDuringErrorWriteDoesNotIntroduceASecondaryFailure(bool ioFailure)
    {
      var exception = CreateRequestException();
      using var cancellation = new CancellationTokenSource();
      var context = new DefaultHttpContext { RequestAborted = cancellation.Token };
      using var body = new FailingResponseStream(cancellation, ioFailure, true);
      context.Response.Body = body;
      var logger = CreateLogger();

      await CreatePipeline(exception, logger).InvokeAsync(context);

      Assert.True(body.Attempted);
      Assert.True(cancellation.IsCancellationRequested);
      AssertLog(logger, exception, LogLevel.Information, StatusCodes.Status400BadRequest);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task WriteFailureWithoutDisconnectionIsNotSilentlySwallowed(bool ioFailure)
    {
      using var cancellation = new CancellationTokenSource();
      var context = new DefaultHttpContext { RequestAborted = cancellation.Token };
      using var body = new FailingResponseStream(cancellation, ioFailure, false);
      context.Response.Body = body;

      var actual = await Record.ExceptionAsync(() => CreatePipeline(CreateRequestException(), CreateLogger()).InvokeAsync(context));

      Assert.Same(body.Failure, actual);
      Assert.False(cancellation.IsCancellationRequested);
    }
    #endregion

    #region Helpers
    private static BadHttpRequestException CreateRequestException(int status = StatusCodes.Status400BadRequest, bool kestrel = false)
    {
      const string message = "Unexpected end of request content";
      if (!kestrel) return new BadHttpRequestException(message, status);

      // Kestrel exposes this legacy subclass but only the server can construct it directly.
#pragma warning disable CS0618
      return (BadHttpRequestException)Activator.CreateInstance(
        typeof(Microsoft.AspNetCore.Server.Kestrel.Core.BadHttpRequestException),
        BindingFlags.Instance | BindingFlags.NonPublic, null, [message, status, null], null)!;
#pragma warning restore CS0618
    }

    private static Mock<ILogger<ExceptionLogMiddleware>> CreateLogger()
    {
      var logger = new Mock<ILogger<ExceptionLogMiddleware>>();
      logger.Setup(value => value.IsEnabled(It.IsAny<LogLevel>())).Returns(true);
      return logger;
    }

    private static ExceptionResponseMiddleware CreatePipeline(Exception exception, Mock<ILogger<ExceptionLogMiddleware>> logger)
    {
      var logging = new ExceptionLogMiddleware(_ => Task.FromException(exception), logger.Object);
      return new ExceptionResponseMiddleware(logging.InvokeAsync);
    }

    private static void AssertLog(Mock<ILogger<ExceptionLogMiddleware>> logger, Exception exception, LogLevel level, int status)
    {
      var entry = Assert.Single(logger.Invocations, value => value.Method.Name == nameof(ILogger.Log));
      Assert.Equal(level, Assert.IsType<LogLevel>(entry.Arguments[0]));
      Assert.Contains($"({status})", entry.Arguments[2]?.ToString(), StringComparison.Ordinal);
      Assert.Same(exception, entry.Arguments[3]);
    }

    private sealed class FailingResponseStream(CancellationTokenSource cancellation, bool ioFailure, bool disconnect) : MemoryStream
    {
      public bool Attempted { get; private set; }

      public Exception Failure { get; } = ioFailure ? new IOException("Transport failure") : new OperationCanceledException("Write cancelled");

      public override ValueTask WriteAsync(ReadOnlyMemory<byte> buffer, CancellationToken cancellationToken = default)
      {
        Attempted = true;
        if (disconnect) cancellation.Cancel();
        return ValueTask.FromException(Failure);
      }

      public override Task WriteAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken) =>
        WriteAsync(buffer.AsMemory(offset, count), cancellationToken).AsTask();
    }
    #endregion
  }
}
