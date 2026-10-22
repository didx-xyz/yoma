namespace Yoma.Core.Domain.Core.Exceptions
{
  /// <summary>
  /// A conflicting request is still being processed, so the current request was not dispatched.
  /// The API returns a conflict response without claiming that this submission was accepted.
  /// </summary>
  public class RequestInProgressException : Exception
  {
    public RequestInProgressException(string message) : base(message)
    {
    }

    public RequestInProgressException(string message, Exception innerException) : base(message, innerException)
    {
    }
  }
}
