using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Infrastructure.Zlto.Models
{
    public class StoreResponseSearch
    {
        [JsonProperty("data")]
        public List<StoreInfo> Items { get; set; }
    }

    public class StoreInfo
    {
        [JsonProperty("store_id")]
        public string StoreId { get; set; }

        [JsonProperty("owner_id")]
        public string OwnerId { get; set; }

        [JsonProperty("owner_origin")]
        public string OwnerOrigin { get; set; }

        [JsonProperty("store_name")]
        public string StoreName { get; set; }

        [JsonProperty("store_description")]
        public string StoreDescription { get; set; }

        [JsonProperty("store_logo")]
        public string StoreLogo { get; set; }

        [JsonProperty("store_country")]
        public int StoreCountry { get; set; }

        [JsonProperty("store_country_info_sc")]
        public StoreCountry Country { get; set; }

        [JsonProperty("store_category_info_sf")]
        public StoreCategory Category { get; set; }

        [JsonProperty("store_state")]
        public int StoreState { get; set; }

        [JsonProperty("store_type")]
        public int StoreType { get; set; }

        [JsonProperty("has_rule")]
        public int HasRule { get; set; }

        [JsonProperty("support_email")]
        public string SupportEmail { get; set; }

        [JsonProperty("last_updated")]
        public DateTime LastUpdated { get; set; }

        [JsonProperty("date_created")]
        public DateTime DateCreated { get; set; }
    }

    public class StoreCountry
    {
        [JsonProperty("country_name"), Required]
        public string Name { get; set; }

        [JsonProperty("country_id"), Required]
        public string Id { get; set; }
    }

    public class StoreCategory
    {
        [JsonProperty("store_category_name"), Required]
        public string CategoryName { get; set; }

        [JsonProperty("category_id"), Required]
        public string Id { get; set; }
    }

    public class StoreResponseItemCategories
    {
        [JsonProperty("data")]
        public List<StoreItemCategory> Items { get; set; }
    }

    public class StoreItemCategory
    {
        [JsonProperty("category_id"), Required]
        public string CategoryId { get; set; }

        [JsonProperty("store_id"), Required]
        public string StoreId { get; set; }

        [JsonProperty("category_info_sc"), Required]
        public StoreCategory Category { get; set; }

        [JsonProperty("item_category_id"), Required]
        public int ItemCategoryId { get; set; }

        [JsonProperty("item_cat_image"), Required]
        public string ItemCatImage { get; set; }

        [JsonProperty("item_cat_name"), Required]
        public string ItemCatName { get; set; }

        [JsonProperty("item_cat_description"), Required]
        public string ItemCatDescription { get; set; }

        [JsonProperty("item_cat_details"), Required]
        public string ItemCatDetails { get; set; }

        [JsonProperty("item_cat_zlto"), Required]
        public int ItemCatZlto { get; set; }

        [JsonProperty("item_cat_state"), Required]
        public int ItemCatState { get; set; }

        [JsonProperty("store_item_count"), Required]
        public int StoreItemCount { get; set; }

        [JsonProperty("has_rule"), Required]
        public int HasRule { get; set; }

        [JsonProperty("date_created"), Required]
        public string DateCreated { get; set; }
    }

    public class StoreResponseSearchItem
    {
        [JsonProperty("data")]
        public List<StoreItem> Items { get; set; }
    }

    public class StoreItem
    {
        [JsonProperty("item_id")]
        public int ItemId { get; set; }

        [JsonProperty("store_id")]
        public string StoreId { get; set; }

        [JsonProperty("store_cat_id")]
        public string StoreCatId { get; set; }

        [JsonProperty("store_info_si")]
        public StoreInfo StoreInfoSi { get; set; }

        [JsonProperty("item_cat_id")]
        public string ItemCatId { get; set; }

        [JsonProperty("item_category_ic")]
        public StoreItemCategory ItemCategoryIc { get; set; }

        [JsonProperty("item_name")]
        public string ItemName { get; set; }

        [JsonProperty("item_description")]
        public string ItemDescription { get; set; }

        [JsonProperty("item_details")]
        public string ItemDetails { get; set; }

        [JsonProperty("item_code")]
        public string ItemCode { get; set; }

        [JsonProperty("item_state")]
        public int ItemState { get; set; }

        [JsonProperty("reserved_user_id")]
        public string ReservedUserId { get; set; }

        [JsonProperty("item_logo")]
        public string ItemLogo { get; set; }

        [JsonProperty("item_zlto")]
        public int ItemZlto { get; set; }

        [JsonProperty("last_updated")]
        public DateTime LastUpdated { get; set; }

        [JsonProperty("date_created")]
        public DateTime DateCreated { get; set; }
    }

    public enum ItemState
    {
        Active = 1,
    }
}