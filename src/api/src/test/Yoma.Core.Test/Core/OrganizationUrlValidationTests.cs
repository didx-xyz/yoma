using FluentValidation;
using Moq;
using Xunit;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Entity.Validators;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Test.Core
{
  public class OrganizationUrlValidationTests
  {
    #region Tests
    [Theory]
    [InlineData(null, true)]
    [InlineData("https://example.com", true)]
    [InlineData("http://example.com/path?key=value#section", true)]
    [InlineData("HTTPS://example.com", true)]
    [InlineData("", false)]
    [InlineData("javascript:alert(1)", false)]
    [InlineData("JaVaScRiPt:alert(1)", false)]
    [InlineData("data:text/html,<script>alert(1)</script>", false)]
    [InlineData("ftp://example.com/file", false)]
    [InlineData("file:///tmp/file", false)]
    [InlineData("mailto:test@example.com", false)]
    [InlineData("https://", false)]
    [InlineData("https://example.com/with space", false)]
    [InlineData("//example.com", false)]
    [InlineData("/relative", false)]
    public void CreateAndUpdateAllowOnlyWellFormedWebUrlsWhenSpecified(string? url, bool valid)
    {
      AssertWebsiteUrl(url, valid);
    }

    [Theory]
    [InlineData(2048, true)]
    [InlineData(2049, false)]
    public void ExistingWebsiteUrlLengthLimitIsPreserved(int length, bool valid)
    {
      const string prefix = "https://example.com/";
      AssertWebsiteUrl(prefix + new string('a', length - prefix.Length), valid);
    }
    #endregion

    #region Private Members
    private static void AssertWebsiteUrl(string? url, bool valid)
    {
      var countries = Mock.Of<ICountryService>();
      var providerTypes = Mock.Of<IOrganizationProviderTypeService>();
      var create = new OrganizationRequestValidatorCreate(countries, providerTypes);
      var update = new OrganizationRequestValidatorUpdate(countries, providerTypes);

      Assert.Equal(valid, create.Validate(new OrganizationRequestCreate { WebsiteURL = url },
        options => options.IncludeProperties(request => request.WebsiteURL)).IsValid);
      Assert.Equal(valid, update.Validate(new OrganizationRequestUpdate { WebsiteURL = url },
        options => options.IncludeProperties(request => request.WebsiteURL)).IsValid);
    }
    #endregion
  }
}
