using Xunit;
using Yoma.Core.Domain.Core.Extensions;

namespace Yoma.Core.Test.Core.Extensions
{
  public class StringExtensionsTests
  {
    [Theory]
    [InlineData("event-123", "event-123")]
    [InlineData("event\r\nforged", "eventforged")]
    [InlineData("event\rforged", "eventforged")]
    [InlineData("event\nforged", "eventforged")]
    public void SanitizeLogValue_ShouldRemoveLineBreaks(string input, string expected)
    {
      Assert.Equal(expected, input.SanitizeLogValue());
    }
  }
}
