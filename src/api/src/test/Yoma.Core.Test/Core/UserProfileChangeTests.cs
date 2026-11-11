using Xunit;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Test.Core
{
  public class UserProfileChangeTests
  {
    #region Tests
    [Fact]
    public void LoginAuditAndComputedFieldsDoNotChangeTheProfileHash()
    {
      var user = new User
      {
        Username = "test@example.org",
        Surname = "Original",
        Coordinates = [28, -26]
      };

      var original = user.ComputeProfileHash();

      user.DateLastLogin = DateTimeOffset.UtcNow;
      user.DateModified = DateTimeOffset.UtcNow;
      user.ExternalId = Guid.NewGuid();
      user.YoIDOnboarded = true;
      user.Country = "Resolved country";
      user.PhotoURL = "https://example.org/photo";
      user.Coordinates = [28, -26];

      Assert.Equal(original, user.ComputeProfileHash());
    }

    [Theory]
    [InlineData(nameof(User.Surname))]
    [InlineData(nameof(User.CountryId))]
    [InlineData(nameof(User.Coordinates))]
    [InlineData(nameof(User.EmailConfirmed))]
    [InlineData(nameof(User.PhotoId))]
    public void StoredProfileChangesAreDetected(string property)
    {
      var original = new User
      {
        Username = "test@example.org",
        Surname = "Original",
        Coordinates = [28, -26]
      };

      var updated = ObjectHelper.DeepCopy(original);

      switch (property)
      {
        case nameof(User.Surname):
          updated.Surname = "Changed";
          break;

        case nameof(User.CountryId):
          updated.CountryId = Guid.NewGuid();
          break;

        case nameof(User.Coordinates):
          updated.Coordinates![0] = 29;
          break;

        case nameof(User.EmailConfirmed):
          updated.EmailConfirmed = true;
          break;

        case nameof(User.PhotoId):
          updated.PhotoId = Guid.NewGuid();
          break;
      }

      Assert.NotEqual(original.ComputeProfileHash(), updated.ComputeProfileHash());
    }
    #endregion
  }
}
