using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using Xunit;
using Yoma.Core.Api.Middleware;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Environment = Yoma.Core.Domain.Core.Environment;

namespace Yoma.Core.Test.SSI
{
  public class SSIEnabledTests
  {
    #region Tests
    [Theory]
    [InlineData("None", Environment.Local)]
    [InlineData("Development, Staging, Production", Environment.Local)]
    [InlineData("Local", Environment.Development)]
    public async Task DisabledEnvironmentReturnsUnavailableWithoutRunningTheAction(string enabledEnvironments, Environment environment)
    {
      var context = CreateContext();
      var invoked = false;

      await CreateFilter(enabledEnvironments, environment).OnResourceExecutionAsync(context, () =>
      {
        invoked = true;
        return Task.FromResult(new ResourceExecutedContext(context, context.Filters));
      });

      Assert.False(invoked);
      var result = Assert.IsType<ObjectResult>(context.Result);
      Assert.Equal((int)HttpStatusCode.ServiceUnavailable, result.StatusCode);
      var error = Assert.Single(Assert.IsType<List<ErrorResponseItem>>(result.Value));
      Assert.Equal(nameof(HttpStatusCode.ServiceUnavailable), error.Type);
      Assert.Equal("SSI is disabled for this environment", error.Message);
    }

    [Theory]
    [InlineData("Local, Development, Staging, Production", Environment.Local)]
    [InlineData(" local , development ", Environment.Local)]
    [InlineData("Production", Environment.Production)]
    public async Task EnabledEnvironmentExecutesTheAction(string enabledEnvironments, Environment environment)
    {
      var context = CreateContext();
      var invoked = false;

      await CreateFilter(enabledEnvironments, environment).OnResourceExecutionAsync(context, () =>
      {
        invoked = true;
        return Task.FromResult(new ResourceExecutedContext(context, context.Filters));
      });

      Assert.True(invoked);
      Assert.Null(context.Result);
    }
    #endregion

    #region Helpers
    private static SSIEnabledFilter CreateFilter(string enabledEnvironments, Environment environment)
    {
      var provider = new Mock<IEnvironmentProvider>();
      provider.SetupGet(o => o.Environment).Returns(environment);
      return new SSIEnabledFilter(Options.Create(new AppSettings { SSIEnabledEnvironments = enabledEnvironments }), provider.Object);
    }

    private static ResourceExecutingContext CreateContext() => new(
      new ActionContext(new DefaultHttpContext(), new RouteData(), new ActionDescriptor()),
      new List<IFilterMetadata>(), new List<IValueProviderFactory>());
    #endregion
  }
}
