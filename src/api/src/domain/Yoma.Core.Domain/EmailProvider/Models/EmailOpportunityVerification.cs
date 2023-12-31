using Newtonsoft.Json;

namespace Yoma.Core.Domain.EmailProvider.Models
{
    public class EmailOpportunityVerification : EmailBase
    {
        [JsonProperty("opportunities")]
        public List<EmailOpportunityVerificationItem> Opportunities { get; set; }
    }

    public class EmailOpportunityVerificationItem
    {
        [JsonProperty("title")]
        public string Title { get; set; }

        [JsonIgnore]
        public DateTimeOffset? DateStart { get; set; }

        [JsonProperty("dateStartFormatted")]
        public string DateStartFormatted => DateStart.HasValue ? DateStart.Value.ToString("ddd, MMM dd, yyyy HH:mm") : "No start date";

        [JsonIgnore]
        public DateTimeOffset? DateEnd { get; set; }

        [JsonProperty("dateEndFormatted")]
        public string DateEndFormatted => DateEnd.HasValue ? DateEnd.Value.ToString("ddd, MMM dd, yyyy HH:mm") : "No end date";

        [JsonIgnore]
        public string? Comment { get; set; }

        [JsonProperty("commentFormatted")]
        public string? CommentFormatted => !string.IsNullOrEmpty(Comment) ? Comment : "No additional information";

        [JsonProperty("url")]
        public string URL { get; set; }

        [JsonIgnore]
        public decimal? ZltoReward { get; set; }

        [JsonProperty("zltoRewardFormatted")]
        public string? ZltoRewardFormatted => ZltoReward.HasValue ? ZltoReward.Value.ToString("0.00") : decimal.Zero.ToString("0.00");

        [JsonIgnore]
        public decimal? YomaReward { get; set; }

        [JsonProperty("yomaRewardFormatted")]
        public string? YomaRewardFormatted => YomaReward.HasValue ? YomaReward.Value.ToString("0.00") : decimal.Zero.ToString("0.00");
    }
}
