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

    [Theory]
    [InlineData("<p><b><br></b></p>")]
    [InlineData("<p><strong>&nbsp;</strong></p>")]
    [InlineData("<p><b><br class='editor-break'></b></p>")]
    [InlineData("<p><B class='empty'> \t\r\n </B ></p>")]
    [InlineData("<div><b><strong><br /></strong></b></div>")]
    [InlineData("<div><b><span class='empty'>&nbsp;<br></span></b></div>")]
    [InlineData("<p><em><br></em><i> </i></p>")]
    public void HtmlToMarkdown_EmptyEmphasisPreservesParagraphsWithoutVisibleMarkers(string empty)
    {
      var result = $"<p><b>Heading</b></p>{empty}<p>Body</p>".HtmlToMarkdown();

      Assert.Equal($"**Heading**{StringExtensions.MarkdownParagraphBreak}Body", result);
      Assert.Null(empty.HtmlToMarkdown());
    }

    [Fact]
    public void HtmlToMarkdown_JobbermanGhanaRegressionKeepsRealHeadingsListsAndInlineLabels()
    {
      // Exact formatting excerpt from GH:1141422, inspected on 2026-10-19.
      const string html = """
        <p><b>What You Will Do:</b></p>
        <p><b><br></b></p>
        <ul><li>Train clients on ERP software.</li><li>Build lasting client relationships.</li></ul>
        <p><br></p>
        <p><b>What You Bring:</b></p>
        <p><b><br></b></p>
        <ul><li>3+ years' working experience.</li><li>Strong problem-solving skills.</li></ul>
        <p><br></p>
        <p><b>Location</b>: Accra</p>
        <p><b>Salary</b>: Attractive</p>
        """;

      var result = html.HtmlToMarkdown()!;
      Assert.Contains("**What You Will Do:**", result);
      Assert.Contains("**What You Bring:**", result);
      Assert.Contains("**Location**: Accra", result);
      Assert.Contains("**Salary**: Attractive", result);
      Assert.Contains("- Train clients on ERP software.\n- Build lasting client relationships.", result);
      Assert.DoesNotContain(result.Split('\n'), line => line.Trim() is "**" or "*");
      Assert.Equal(8, result.Split("**", StringSplitOptions.None).Length - 1);
      Assert.Equal(result, result.HtmlToMarkdown());
    }

    [Fact]
    public void HtmlToMarkdown_JobbermanNigeriaRegressionPreservesSpacingBeforeBenefits()
    {
      // Exact formatting excerpt from NG:1269975, inspected on 2026-10-19.
      const string html = """
        <p><br></p><p><b>Working Arrangements:</b></p>
        <ul><li>Full-time remote role. Candidates must have a reliable laptop, internet connection, and suitable working environment. </li><li>Flexibility to support scheduled evening or occasional weekend training sessions is required, with working arrangements agreed in advance.</li></ul>
        <p><b><br></b></p>
        <p><b>Benefits:</b></p>
        <ul><li>Performance and compensation review after six months, with opportunities for career progression.</li></ul>
        """;

      var result = html.HtmlToMarkdown()!;
      Assert.Contains("**Working Arrangements:**", result);
      Assert.Contains($"{StringExtensions.MarkdownParagraphBreak}**Benefits:**", result);
      Assert.Contains("- Performance and compensation review after six months", result);
      Assert.DoesNotContain(result.Split('\n'), line => line.Trim() is "**" or "*");
      Assert.Equal(4, result.Split("**", StringSplitOptions.None).Length - 1);
      Assert.Equal(result, result.HtmlToMarkdown());
    }

    [Theory]
    [InlineData("<p><strong> bold </strong> and <em>italic</em></p>", " **bold** and *italic*")]
    [InlineData("<body><p>Body</p></body><img src='image.png'>", "Body")]
    [InlineData("<button>Plain button text</button>", "Plain button text")]
    [InlineData("<strongly>Plain text</strongly>", "Plain text")]
    [InlineData("<p><b>Requirements:<br></b></p>", "**Requirements:**")]
    [InlineData("<p><b><br>Requirements:</b></p>", "**Requirements:**")]
    [InlineData("<p><b><br>Requirements:<br></b></p>", "**Requirements:**")]
    [InlineData("<p><em> italic </em></p>", "*italic*")]
    [InlineData("<p><b><em> both </em></b></p>", "***both***")]
    [InlineData("<p>Use ** literally</p>", "Use ** literally")]
    [InlineData("<p>Already **bold** text</p>", "Already **bold** text")]
    [InlineData("<p><b> <i>Both</i> </b></p>", "***Both***")]
    public void HtmlToMarkdown_PreservesContentWithoutTreatingTagPrefixesAsEmphasis(string html, string expected)
    {
      Assert.Equal(expected.Trim(), html.HtmlToMarkdown());
    }

    [Fact]
    public void HtmlToMarkdown_PreservesLinksUnderlineAndParagraphBoundaries()
    {
      var result = "<p><strong>Read <a href='https://example.com/info'>the guide</a></strong></p><p><u>Note</u></p>"
        .HtmlToMarkdown();

      Assert.Equal($"**Read [the guide](https://example.com/info)**{StringExtensions.MarkdownParagraphBreak}<u>Note</u>", result);
    }
  }
}
