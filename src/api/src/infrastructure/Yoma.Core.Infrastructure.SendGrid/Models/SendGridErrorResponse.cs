namespace Yoma.Core.Infrastructure.SendGrid.Models
{
  public class SendGridErrorResponse
  {
    public List<SendGridError> Errors { get; set; }
  }

  public class SendGridError
  {
    public string Message { get; set; }
    public string Field { get; set; }
    public string Help { get; set; }
  }
}
