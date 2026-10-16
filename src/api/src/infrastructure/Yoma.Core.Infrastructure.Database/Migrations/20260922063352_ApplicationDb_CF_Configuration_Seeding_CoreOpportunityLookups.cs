using Microsoft.EntityFrameworkCore.Migrations;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
  internal static class ApplicationDb_CF_Configuration_Seeding_CoreOpportunityLookups
  {
    #region Class Variables
    private static readonly string[] CurrencyColumns = ["Id", "Code", "Name", "DateCreated"];
    private static readonly string[] GoalColumns = ["Id", "Number", "Name", "DateCreated"];
    private static readonly string[] GroupColumns = ["Id", "Name", "DateCreated"];
    #endregion

    internal static void Seed(MigrationBuilder migrationBuilder)
    {
      #region Lookups
      var created = DateTimeOffset.UtcNow;

      #region Currencies
      // Stable snapshot of SIX ISO 4217 List One, retrieved 2026-09-28.
      // Ordinary currencies only: fund codes and entries without monetary minor units are excluded.
      // https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml
      // No ZLTO, currency conversion or changes to payout/treasury currency semantics.
      migrationBuilder.InsertData(
        schema: "Lookup",
        table: "Currency",
        columns: CurrencyColumns,
        values: new object[,]
        {
          { new Guid("804b36e1-6c9b-4d71-909a-000000000001"), "AED", "UAE Dirham", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000002"), "AFN", "Afghani", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000003"), "ALL", "Lek", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000004"), "AMD", "Armenian Dram", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000005"), "AOA", "Kwanza", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000006"), "ARS", "Argentine Peso", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000007"), "AUD", "Australian Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000008"), "AWG", "Aruban Florin", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000009"), "AZN", "Azerbaijan Manat", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000010"), "BAM", "Convertible Mark", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000011"), "BBD", "Barbados Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000012"), "BDT", "Taka", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000013"), "BHD", "Bahraini Dinar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000014"), "BIF", "Burundi Franc", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000015"), "BMD", "Bermudian Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000016"), "BND", "Brunei Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000017"), "BOB", "Boliviano", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000018"), "BRL", "Brazilian Real", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000019"), "BSD", "Bahamian Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000020"), "BTN", "Ngultrum", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000021"), "BWP", "Pula", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000022"), "BYN", "Belarusian Ruble", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000023"), "BZD", "Belize Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000024"), "CAD", "Canadian Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000025"), "CDF", "Congolese Franc", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000026"), "CHF", "Swiss Franc", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000027"), "CLP", "Chilean Peso", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000028"), "CNY", "Yuan Renminbi", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000029"), "COP", "Colombian Peso", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000030"), "CRC", "Costa Rican Colon", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000031"), "CUP", "Cuban Peso", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000032"), "CVE", "Cabo Verde Escudo", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000033"), "CZK", "Czech Koruna", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000034"), "DJF", "Djibouti Franc", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000035"), "DKK", "Danish Krone", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000036"), "DOP", "Dominican Peso", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000037"), "DZD", "Algerian Dinar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000038"), "EGP", "Egyptian Pound", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000039"), "ERN", "Nakfa", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000040"), "ETB", "Ethiopian Birr", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000041"), "EUR", "Euro", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000042"), "FJD", "Fiji Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000043"), "FKP", "Falkland Islands Pound", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000044"), "GBP", "Pound Sterling", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000045"), "GEL", "Lari", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000046"), "GHS", "Ghana Cedi", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000047"), "GIP", "Gibraltar Pound", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000048"), "GMD", "Dalasi", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000049"), "GNF", "Guinean Franc", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000050"), "GTQ", "Quetzal", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000051"), "GYD", "Guyana Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000052"), "HKD", "Hong Kong Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000053"), "HNL", "Lempira", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000054"), "HTG", "Gourde", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000055"), "HUF", "Forint", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000056"), "IDR", "Rupiah", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000057"), "ILS", "New Israeli Sheqel", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000058"), "INR", "Indian Rupee", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000059"), "IQD", "Iraqi Dinar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000060"), "IRR", "Iranian Rial", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000061"), "ISK", "Iceland Krona", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000062"), "JMD", "Jamaican Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000063"), "JOD", "Jordanian Dinar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000064"), "JPY", "Yen", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000065"), "KES", "Kenyan Shilling", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000066"), "KGS", "Som", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000067"), "KHR", "Riel", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000068"), "KMF", "Comorian Franc ", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000069"), "KPW", "North Korean Won", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000070"), "KRW", "Won", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000071"), "KWD", "Kuwaiti Dinar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000072"), "KYD", "Cayman Islands Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000073"), "KZT", "Tenge", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000074"), "LAK", "Lao Kip", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000075"), "LBP", "Lebanese Pound", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000076"), "LKR", "Sri Lanka Rupee", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000077"), "LRD", "Liberian Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000078"), "LSL", "Loti", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000079"), "LYD", "Libyan Dinar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000080"), "MAD", "Moroccan Dirham", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000081"), "MDL", "Moldovan Leu", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000082"), "MGA", "Malagasy Ariary", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000083"), "MKD", "Denar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000084"), "MMK", "Kyat", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000085"), "MNT", "Tugrik", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000086"), "MOP", "Pataca", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000087"), "MRU", "Ouguiya", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000088"), "MUR", "Mauritius Rupee", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000089"), "MVR", "Rufiyaa", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000090"), "MWK", "Malawi Kwacha", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000091"), "MXN", "Mexican Peso", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000092"), "MYR", "Malaysian Ringgit", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000093"), "MZN", "Mozambique Metical", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000094"), "NAD", "Namibia Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000095"), "NGN", "Naira", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000096"), "NIO", "Cordoba Oro", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000097"), "NOK", "Norwegian Krone", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000098"), "NPR", "Nepalese Rupee", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000099"), "NZD", "New Zealand Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000100"), "OMR", "Rial Omani", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000101"), "PAB", "Balboa", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000102"), "PEN", "Sol", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000103"), "PGK", "Kina", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000104"), "PHP", "Philippine Peso", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000105"), "PKR", "Pakistan Rupee", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000106"), "PLN", "Zloty", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000107"), "PYG", "Guarani", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000108"), "QAR", "Qatari Rial", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000109"), "RON", "Romanian Leu", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000110"), "RSD", "Serbian Dinar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000111"), "RUB", "Russian Ruble", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000112"), "RWF", "Rwanda Franc", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000113"), "SAR", "Saudi Riyal", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000114"), "SBD", "Solomon Islands Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000115"), "SCR", "Seychelles Rupee", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000116"), "SDG", "Sudanese Pound", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000117"), "SEK", "Swedish Krona", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000118"), "SGD", "Singapore Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000119"), "SHP", "Saint Helena Pound", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000120"), "SLE", "Leone", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000121"), "SOS", "Somali Shilling", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000122"), "SRD", "Surinam Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000123"), "SSP", "South Sudanese Pound", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000124"), "STN", "Dobra", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000125"), "SVC", "El Salvador Colon", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000126"), "SYP", "Syrian Pound", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000127"), "SZL", "Lilangeni", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000128"), "THB", "Baht", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000129"), "TJS", "Somoni", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000130"), "TMT", "Turkmenistan New Manat", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000131"), "TND", "Tunisian Dinar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000132"), "TOP", "Pa’anga", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000133"), "TRY", "Turkish Lira", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000134"), "TTD", "Trinidad and Tobago Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000135"), "TWD", "New Taiwan Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000136"), "TZS", "Tanzanian Shilling", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000137"), "UAH", "Hryvnia", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000138"), "UGX", "Uganda Shilling", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000139"), "USD", "US Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000140"), "UYU", "Peso Uruguayo", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000141"), "UZS", "Uzbekistan Sum", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000142"), "VED", "Bolívar Soberano", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000143"), "VES", "Bolívar Soberano", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000144"), "VND", "Dong", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000145"), "VUV", "Vatu", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000146"), "WST", "Tala", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000147"), "XAF", "CFA Franc BEAC", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000148"), "XCD", "East Caribbean Dollar", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000149"), "XCG", "Caribbean Guilder", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000150"), "XOF", "CFA Franc BCEAO", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000151"), "XPF", "CFP Franc", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000152"), "YER", "Yemeni Rial", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000153"), "ZAR", "Rand", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000154"), "ZMW", "Zambian Kwacha", created },
          { new Guid("804b36e1-6c9b-4d71-909a-000000000155"), "ZWG", "Zimbabwe Gold", created }
        });
      #endregion Currencies

      #region Sustainable Development Goals
      // Official 17 UN goals, not their underlying targets: https://sdgs.un.org/goals
      migrationBuilder.InsertData(
        schema: "Lookup",
        table: "SustainableDevelopmentGoal",
        columns: GoalColumns,
        values: new object[,]
        {
          { new Guid("dc2a742f-985b-40dc-905c-000000000001"), (short)1, "No poverty", created },
          { new Guid("dc2a742f-985b-40dc-905c-000000000002"), (short)2, "Zero hunger", created },
          { new Guid("dc2a742f-985b-40dc-905c-000000000003"), (short)3, "Good health and well-being", created },
          { new Guid("dc2a742f-985b-40dc-905c-000000000004"), (short)4, "Quality education", created },
          { new Guid("dc2a742f-985b-40dc-905c-000000000005"), (short)5, "Gender equality", created },
          { new Guid("dc2a742f-985b-40dc-905c-000000000006"), (short)6, "Clean water and sanitation", created },
          { new Guid("dc2a742f-985b-40dc-905c-000000000007"), (short)7, "Affordable and clean energy", created },
          { new Guid("dc2a742f-985b-40dc-905c-000000000008"), (short)8, "Decent work and economic growth", created },
          { new Guid("dc2a742f-985b-40dc-905c-000000000009"), (short)9, "Industry, innovation and infrastructure", created },
          { new Guid("dc2a742f-985b-40dc-905c-000000000010"), (short)10, "Reduced inequalities", created },
          { new Guid("dc2a742f-985b-40dc-905c-000000000011"), (short)11, "Sustainable cities and communities", created },
          { new Guid("dc2a742f-985b-40dc-905c-000000000012"), (short)12, "Responsible consumption and production", created },
          { new Guid("dc2a742f-985b-40dc-905c-000000000013"), (short)13, "Climate action", created },
          { new Guid("dc2a742f-985b-40dc-905c-000000000014"), (short)14, "Life below water", created },
          { new Guid("dc2a742f-985b-40dc-905c-000000000015"), (short)15, "Life on land", created },
          { new Guid("dc2a742f-985b-40dc-905c-000000000016"), (short)16, "Peace, justice and strong institutions", created },
          { new Guid("dc2a742f-985b-40dc-905c-000000000017"), (short)17, "Partnerships for the goals", created }
        });
      #endregion Sustainable Development Goals

      #region Targeted Groups
      migrationBuilder.InsertData(
        schema: "Lookup",
        table: "TargetedGroup",
        columns: GroupColumns,
        values: new object[,]
        {
          { new Guid("ed284feb-0e83-4f7c-8ae0-000000000001"), "Open to all", created },
          { new Guid("ed284feb-0e83-4f7c-8ae0-000000000002"), "Youth with disabilities", created },
          { new Guid("ed284feb-0e83-4f7c-8ae0-000000000003"), "Women / girls", created },
          { new Guid("ed284feb-0e83-4f7c-8ae0-000000000004"), "Men / boys", created },
          { new Guid("ed284feb-0e83-4f7c-8ae0-000000000005"), "Rural youth", created },
          { new Guid("ed284feb-0e83-4f7c-8ae0-000000000006"), "Urban youth", created },
          { new Guid("ed284feb-0e83-4f7c-8ae0-000000000007"), "Refugee / displaced youth", created },
          { new Guid("ed284feb-0e83-4f7c-8ae0-000000000008"), "Second-chance learners", created }
        });
      #endregion Targeted Groups
      #endregion Lookups
    }
  }
}
