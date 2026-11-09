namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  public class ApiResponse<T>
  {
    public T? Data { get; set; }

    public Dictionary<string, string>? Links { get; set; }
  }
}
