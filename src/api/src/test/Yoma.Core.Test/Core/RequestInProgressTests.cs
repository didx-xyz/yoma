using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using System.Net;
using System.Net.Mime;
using System.Text.Json;
using Xunit;
using Yoma.Core.Api.Middleware;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Test.Core
{
  public class RequestInProgressTests
  {
    #region Tests
    [Theory]
    [InlineData(0, HttpStatusCode.Conflict)]
    [InlineData(1, HttpStatusCode.BadRequest)]
    [InlineData(2, HttpStatusCode.InternalServerError)]
    public async Task ResponseMiddlewarePreservesTheErrorEnvelopeAndMapsOnlyTheDedicatedExceptionToConflict(int scenario, HttpStatusCode expected)
    {
      Exception exception = scenario switch
      {
        0 => new RequestInProgressException("Please wait", new InvalidOperationException("Internal detail")),
        1 => new BusinessException("Existing validation"),
        2 => new InvalidOperationException("Unexpected failure"),
        _ => throw new NotSupportedException($"Scenario '{scenario}' is not supported")
      };
      var context = new DefaultHttpContext();
      context.Response.Body = new MemoryStream();
      var middleware = new ExceptionResponseMiddleware(_ => throw exception);

      await middleware.InvokeAsync(context);

      Assert.Equal((int)expected, context.Response.StatusCode);
      Assert.StartsWith(MediaTypeNames.Application.Json, context.Response.ContentType);
      context.Response.Body.Position = 0;
      var errors = await JsonSerializer.DeserializeAsync<List<ErrorResponseItem>>(context.Response.Body,
        JsonSerializerOptions.Web, TestContext.Current.CancellationToken);
      var error = Assert.Single(Assert.IsType<List<ErrorResponseItem>>(errors));
      Assert.Equal(exception.GetType().Name, error.Type);
      Assert.Equal(exception.Message, error.Message);
    }

    [Fact]
    public async Task InProgressConflictIsLoggedAsInformationWithTheActualHttpStatus()
    {
      var logger = new Mock<ILogger<ExceptionLogMiddleware>>();
      logger.Setup(value => value.IsEnabled(LogLevel.Information)).Returns(true);
      var exception = new RequestInProgressException("Please wait");
      var middleware = new ExceptionLogMiddleware(_ => throw exception, logger.Object);

      Assert.Same(exception, await Assert.ThrowsAsync<RequestInProgressException>(() => middleware.InvokeAsync(new DefaultHttpContext())));

      var entry = Assert.Single(logger.Invocations, value => value.Method.Name == nameof(ILogger.Log));
      Assert.Equal(LogLevel.Information, Assert.IsType<LogLevel>(entry.Arguments[0]));
      Assert.Contains("(409)", entry.Arguments[2]?.ToString(), StringComparison.Ordinal);
      Assert.Same(exception, entry.Arguments[3]);
    }

    #endregion
  }
}
