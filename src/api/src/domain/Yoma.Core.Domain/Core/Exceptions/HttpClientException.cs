using System.Net;

namespace Yoma.Core.Domain.Core.Exceptions
{
  public class HttpClientException : Exception
  {
    #region Constructor
    public HttpClientException(HttpStatusCode statuscode, string message) : base(message)
    {
      StatusCode = statuscode;
    }
    #endregion

    #region Public Members
    public HttpStatusCode StatusCode { get; }
    #endregion
  }
}
