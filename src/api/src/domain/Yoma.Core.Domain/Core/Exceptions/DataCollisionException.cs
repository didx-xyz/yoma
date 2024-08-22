namespace Yoma.Core.Domain.Core.Exceptions
{
  public class DataCollisionException : Exception
  {
    public DataCollisionException(string message) : base(message)
    {
    }

    public DataCollisionException(string message, Exception innerException) : base(message, innerException)
    {
    }
  }
}
