namespace Yoma.Core.Infrastructure.SendGrid.Models
{
  public class SendGridErrorResponse
  {
    public List<SendGridError> Errors { get; set; } = null!;
  }

  public class SendGridError
  {
    public string Message { get; set; } = null!;
    public string Field { get; set; } = null!;
    public string Help { get; set; } = null!;
  }
}
