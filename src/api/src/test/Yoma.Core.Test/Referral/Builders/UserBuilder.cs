using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Test.Referral.Builders
{
  public class UserBuilder
  {
    private Guid _id = Guid.NewGuid();
    private string _username = "testuser@example.com";
    private string? _email = "testuser@example.com";
    private readonly bool? _emailConfirmed = true;
    private readonly string? _firstName = "Test";
    private readonly string? _surname = "User";
    private string? _displayName = "Test User";
    private string? _phoneNumber = "+27831234567";
    private bool? _phoneNumberConfirmed = true;
    private Guid? _countryId = Guid.Parse("e0000000-0000-0000-0000-000000000001");
    private string? _country = "South Africa";
    private bool? _yoIDOnboarded = true;
    private DateTimeOffset? _dateYoIDOnboarded = DateTimeOffset.UtcNow.AddDays(-1);
    private readonly DateTimeOffset _dateCreated = DateTimeOffset.UtcNow.AddDays(-7);
    private readonly DateTimeOffset _dateModified = DateTimeOffset.UtcNow;

    public UserBuilder WithId(Guid id) { _id = id; return this; }
    public UserBuilder WithUsername(string username) { _username = username; _email = username; return this; }
    public UserBuilder WithDisplayName(string? displayName) { _displayName = displayName; return this; }
    public UserBuilder WithCountryId(Guid? countryId) { _countryId = countryId; return this; }
    public UserBuilder WithCountry(string? country) { _country = country; return this; }
    public UserBuilder WithPhoneNumber(string? phoneNumber) { _phoneNumber = phoneNumber; return this; }
    public UserBuilder WithPhoneNumberConfirmed(bool? confirmed) { _phoneNumberConfirmed = confirmed; return this; }
    public UserBuilder WithYoIDOnboarded(DateTimeOffset? dateOnboarded)
    {
      _dateYoIDOnboarded = dateOnboarded;
      _yoIDOnboarded = dateOnboarded.HasValue;
      return this;
    }
    public UserBuilder NotOnboarded()
    {
      _yoIDOnboarded = false;
      _dateYoIDOnboarded = null;
      return this;
    }

    public User Build() => new()
    {
      Id = _id,
      Username = _username,
      Email = _email,
      EmailConfirmed = _emailConfirmed,
      FirstName = _firstName,
      Surname = _surname,
      DisplayName = _displayName,
      PhoneNumber = _phoneNumber,
      PhoneNumberConfirmed = _phoneNumberConfirmed,
      CountryId = _countryId,
      Country = _country,
      YoIDOnboarded = _yoIDOnboarded,
      DateYoIDOnboarded = _dateYoIDOnboarded,
      DateCreated = _dateCreated,
      DateModified = _dateModified
    };
  }
}
