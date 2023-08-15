using System.Text.RegularExpressions;

namespace Yoma.Core.Domain.Core.Validators
{
  public static partial class RegExValidators
  {
    [GeneratedRegex("^[\\+]?[(]?[0-9]{3}[)]?[-\\s\\.]?[0-9]{3}[-\\s\\.]?[0-9]{4,6}$")]
    public static partial Regex PhoneNumber();

    [GeneratedRegex("[^a-zA-Z0-9 -]")]
    public static partial Regex AplhaNumeric();
  }
}
