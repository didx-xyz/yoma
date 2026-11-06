using System.Reflection;
using Xunit;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Client;

namespace Yoma.Core.Test.PartnerSync
{
  public class IXONavigationUrlTests
  {
    #region Tests
    [Theory]
    [InlineData("javascript:alert('{token}/{opportunityId}')")]
    [InlineData("data:text/html,{token}/{opportunityId}")]
    [InlineData("ftp://example.org/{token}/{opportunityId}")]
    [InlineData("/login?token={token}&id={opportunityId}")]
    public void RejectsNonWebDestinations(string pattern)
    {
      var error = Assert.Throws<TargetInvocationException>(() => Build(pattern));
      Assert.IsType<InvalidOperationException>(error.InnerException);
    }

    [Theory]
    [InlineData("http")]
    [InlineData("https")]
    public void PreservesWebDestinationsAndEncodesSubstitutedValues(string scheme)
    {
      Assert.Equal($"{scheme}://example.org/login?token=a%2Fb%3Fc&id=item%2F1",
        Build($"{scheme}://example.org/login?token={{token}}&id={{opportunityId}}"));
    }
    #endregion

    #region Private Members
    private static string Build(string pattern)
      => (string)typeof(IXOClient).GetMethod("BuildAutoLoginUrl", BindingFlags.Static | BindingFlags.NonPublic)!
        .Invoke(null, [pattern, "a/b?c", "item/1"])!;
    #endregion
  }
}
