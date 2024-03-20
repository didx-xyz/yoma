using Newtonsoft.Json;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class ObjectHelper
  {
    public static T DeepCopy<T>(T obj)
        where T : class
    {
      if (obj == null)
        throw new ArgumentNullException(nameof(obj));

      var json = JsonConvert.SerializeObject(obj);
      var result = JsonConvert.DeserializeObject<T>(json);
      return result ?? throw new InvalidOperationException("Deep copy failed using JSON serilization");
    }
  }
}
