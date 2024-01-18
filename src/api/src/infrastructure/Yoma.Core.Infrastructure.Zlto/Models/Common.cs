using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Zlto.Models
{
    public class Common
    {
        public class TransactionInfo
        {
            [JsonProperty("ztid")]
            public int TransactionId { get; set; }

            [JsonProperty("acc_from")]
            public string AccFrom { get; set; }

            [JsonProperty("amount")]
            public int Amount { get; set; }

            [JsonProperty("trans_status")]
            public int TransactionStatus { get; set; }

            [JsonProperty("service_name")]
            public string ServiceName { get; set; }

            [JsonProperty("last_updated")]
            public DateTime LastUpdated { get; set; }

            [JsonProperty("trans_type")]
            public int TransType { get; set; }

            [JsonProperty("acc_to")]
            public string AccountTo { get; set; }

            [JsonProperty("trans_payload")]
            public string TransPayload { get; set; }

            [JsonProperty("service_ref_id")]
            public string ServiceRefId { get; set; }

            [JsonProperty("date_created")]
            public DateTime DateCreated { get; set; }
        }

        public class BankResponse
        {
            [JsonProperty("transaction_info")]
            public TransactionInfo TransactionInfo { get; set; }

            [JsonProperty("wallet_info")]
            public string WalletInfo { get; set; }
        }
    }
}
