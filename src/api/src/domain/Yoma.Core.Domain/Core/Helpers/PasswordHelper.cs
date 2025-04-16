using System.Security.Cryptography;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class PasswordHelper
  {
    #region Class Variables
    private const string Uppercase = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
    private const string Lowercase = "abcdefghijkmnopqrstuvwxyz";
    private const string Digits = "0123456789";
    private const string Symbols = "!@#$%^&*()-_=+[]{}|;:,.<>?";
    #endregion

    #region Public Members
    public static string GenerateStrongPassword(int length = 10)
    {
      if (length < 8)
        throw new ArgumentException("Password length must be at least 8 characters.");

      // Required characters
      var required = new[]
      {
            Uppercase[RandomNumberGenerator.GetInt32(Uppercase.Length)],
            Lowercase[RandomNumberGenerator.GetInt32(Lowercase.Length)],
            Digits[RandomNumberGenerator.GetInt32(Digits.Length)],
            Symbols[RandomNumberGenerator.GetInt32(Symbols.Length)],
        };

      var allChars = Uppercase + Lowercase + Digits + Symbols;
      var result = new char[length];

      // Copy required characters into result
      for (int i = 0; i < required.Length; i++)
        result[i] = required[i];

      // Fill the rest with random characters from the full set
      for (int i = required.Length; i < length; i++)
        result[i] = allChars[RandomNumberGenerator.GetInt32(allChars.Length)];

      // Shuffle for randomness
      Shuffle(result);
      return new string(result);
    }
    #endregion

    #region Private Members
    private static void Shuffle(Span<char> span)
    {
      for (int i = span.Length - 1; i > 0; i--)
      {
        int j = RandomNumberGenerator.GetInt32(i + 1);
        (span[i], span[j]) = (span[j], span[i]);
      }
    }
    #endregion
  }
}
