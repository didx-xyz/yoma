namespace Yoma.Core.Domain.Exceptions
{
  public class DataInconsistencyException : Exception
  {
    public DataInconsistencyException(string message) : base(message)
    {
    }

    public DataInconsistencyException(string message, Exception innerException) : base(message, innerException)
    {
    }
  }
}
