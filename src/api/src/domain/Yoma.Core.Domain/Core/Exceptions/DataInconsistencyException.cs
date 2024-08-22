namespace Yoma.Core.Domain.Core.Exceptions
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
