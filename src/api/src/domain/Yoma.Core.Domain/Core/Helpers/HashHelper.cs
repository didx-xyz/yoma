using System.Security.Cryptography;
using System.Text;

namespace Yoma.Core.Domain.Core.Helpers
{
    public static class HashHelper
    {
        public static string ComputeSHA256Hash(string input)
        {
            var bytes = Encoding.UTF8.GetBytes(input);
            var hash = SHA256.HashData(bytes);

            // Convert the byte array to a hexadecimal string
            var builder = new StringBuilder();
            for (int i = 0; i < hash.Length; i++)
                builder.Append(hash[i].ToString("x2"));
  
            return builder.ToString();
        }
    }
}
