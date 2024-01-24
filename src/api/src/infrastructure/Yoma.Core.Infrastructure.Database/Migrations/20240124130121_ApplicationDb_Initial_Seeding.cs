using Microsoft.EntityFrameworkCore.Migrations;
using Yoma.Core.Domain.Core.Helpers;

namespace Yoma.Core.Infrastructure.Database.Migrations
{
    internal class ApplicationDb_Initial_Seeding
    {
        internal static void Seed(MigrationBuilder migrationBuilder)
        {
            #region Entity
            migrationBuilder.InsertData(
            table: "OrganizationStatus",
            columns: new[] { "Id", "Name", "DateCreated" },
            values: new object[,]
            {
                    {"88D1F51E-C0E4-4547-9EEE-6923C009980F","Inactive",DateTimeOffset.Now}
                    ,
                    {"5C381E21-9EB9-4F0E-8548-847E537BB61E","Active",DateTimeOffset.Now}
                    ,
                    {"1901628B-2B0C-4E34-8684-7A991EAA21F9","Declined",DateTimeOffset.Now}
                    ,
                    {"CCA1F97F-A848-4E11-A8EA-A1E0CDD4149F","Deleted",DateTimeOffset.Now}
            },
            schema: "Entity");

            migrationBuilder.InsertData(
            table: "OrganizationProviderType",
            columns: new[] { "Id", "Name", "DateCreated" },
            values: new object[,]
            {
                    {"A3BCAA03-B31C-4830-AAE8-06BBA701D3F0","Education",DateTimeOffset.Now}
                    ,
                    {"6FB02F6F-34FE-4E6E-9094-2E3B54115235","Impact",DateTimeOffset.Now}
                    ,
                    {"D2987F9F-8CC8-4576-AF09-C01213A1435E","Employment",DateTimeOffset.Now}
                    ,
                    {"41690ADD-B95C-44C3-AD3B-8E02E5890FD4","Marketplace",DateTimeOffset.Now}
            },
            schema: "Entity");

            migrationBuilder.InsertData(
            table: "User",
            columns: new[] { "Id", "Email", "EmailConfirmed", "FirstName", "Surname", "DisplayName", "DateCreated", "DateModified" },
            values: new object[,]
            {
                    {"8929632E-2911-42FF-9A44-055DEF231B87",HttpContextAccessorHelper.GetUsernameSystem,false,"Yoma","System","Yoma System",DateTimeOffset.Now,DateTimeOffset.Now}
            },
            schema: "Entity");

            #endregion Entity

            #region Lookups
            migrationBuilder.InsertData(
            table: "Country",
            columns: new[] { "Id", "Name", "CodeAlpha2", "CodeAlpha3", "CodeNumeric", "DateCreated" },
            values: new object[,]
            {
                    {"a0d029b2-49ca-4e89-81aa-8d06be5d2241","Afghanistan","AF","AFG","4",DateTimeOffset.Now}
                    ,
                    {"fb8c57b0-255a-4528-ae87-4b324f47a4d5","Åland Islands","AX","ALA","248",DateTimeOffset.Now}
                    ,
                    {"72301ed7-691b-4258-8363-c94c88918e7c","Albania","AL","ALB","8",DateTimeOffset.Now}
                    ,
                    {"d21d35f8-d319-46bc-8818-c266ffb8d32c","Algeria","DZ","DZA","12",DateTimeOffset.Now}
                    ,
                    {"e958aaef-22ad-42a9-8017-d4ed5f9231a0","American Samoa","AS","ASM","16",DateTimeOffset.Now}
                    ,
                    {"3036f767-1b2d-4dc1-8b31-0edc75e2235d","Andorra","AD","AND","20",DateTimeOffset.Now}
                    ,
                    {"37c77fb4-7ac6-4994-880f-c01296832a0e","Angola","AO","AGO","24",DateTimeOffset.Now}
                    ,
                    {"3b3a8faf-aa48-4884-9b0b-b865ce305f13","Anguilla","AI","AIA","660",DateTimeOffset.Now}
                    ,
                    {"a6f1c4c6-afee-4224-83a1-013061b433b6","Antarctica","AQ","ATA","10",DateTimeOffset.Now}
                    ,
                    {"5cff2dfc-1bdd-44cb-a392-f8b75d1c9495","Antigua and Barbuda","AG","ATG","28",DateTimeOffset.Now}
                    ,
                    {"d564c13e-0715-4f44-aeb3-21bdfe4d2219","Argentina","AR","ARG","32",DateTimeOffset.Now}
                    ,
                    {"58e44cce-310a-4d5e-a207-253597705099","Armenia","AM","ARM","51",DateTimeOffset.Now}
                    ,
                    {"a6e08be7-096d-4e3d-9e94-9fbc9c8aa8df","Aruba","AW","ABW","533",DateTimeOffset.Now}
                    ,
                    {"bd1296b1-e347-40ad-9ea7-4b48f399cf65","Australia","AU","AUS","36",DateTimeOffset.Now}
                    ,
                    {"146a7383-f1e0-4a3d-a9a0-edbcacc2a6ef","Austria","AT","AUT","40",DateTimeOffset.Now}
                    ,
                    {"003358f8-22ca-4301-86b7-922ed14716ee","Azerbaijan","AZ","AZE","31",DateTimeOffset.Now}
                    ,
                    {"055616ce-4d23-4dec-901c-60259e5ee55a","Bahamas","BS","BHS","44",DateTimeOffset.Now}
                    ,
                    {"1ce96971-155c-44e2-9ed2-6556bcff9557","Bahrain","BH","BHR","48",DateTimeOffset.Now}
                    ,
                    {"315d42dc-cff8-48be-8443-786b4b785615","Bangladesh","BD","BGD","50",DateTimeOffset.Now}
                    ,
                    {"19f99b77-98c7-4981-a480-ca90a015e32f","Barbados","BB","BRB","52",DateTimeOffset.Now}
                    ,
                    {"9f4eea75-3e64-405f-8f17-7e9e6fd0745a","Belarus","BY","BLR","112",DateTimeOffset.Now}
                    ,
                    {"3ba221d6-e01a-48ae-9f90-89a226856b6f","Belgium","BE","BEL","56",DateTimeOffset.Now}
                    ,
                    {"8af05ae0-feb1-4d0d-b833-1859a9ace61e","Belize","BZ","BLZ","84",DateTimeOffset.Now}
                    ,
                    {"82b2cd7f-de0f-4465-ab7d-434d34658898","Benin","BJ","BEN","204",DateTimeOffset.Now}
                    ,
                    {"528419a5-e076-4c3d-b79c-6adcea69ed9a","Bermuda","BM","BMU","60",DateTimeOffset.Now}
                    ,
                    {"31b8bb88-6039-41bc-866b-ac1f9c7a213a","Bhutan","BT","BTN","64",DateTimeOffset.Now}
                    ,
                    {"ca0beff2-f231-442a-bc8b-22c8f4e7aaed","Bolivia","BO","BOL","68",DateTimeOffset.Now}
                    ,
                    {"99dd1f36-165d-49fd-b6da-e5ec4c91a057","Bosnia and Herzegovina","BA","BIH","70",DateTimeOffset.Now}
                    ,
                    {"da255132-2f8b-4e4a-b8ba-4678004f4e63","Botswana","BW","BWA","72",DateTimeOffset.Now}
                    ,
                    {"3e9ae3e9-95fa-41a3-b7a9-351b9a6c1722","Bouvet Island","BV","BVT","74",DateTimeOffset.Now}
                    ,
                    {"512ae770-5150-4a8c-bd64-f06b80e1264f","Brazil","BR","BRA","76",DateTimeOffset.Now}
                    ,
                    {"3ad78a12-bca2-4b89-89c0-bedceb5c080e","British Indian Ocean Territory","IO","IOT","86",DateTimeOffset.Now}
                    ,
                    {"de05ffcc-5900-4a8d-bad1-6d87745bbfd6","British Virgin Islands","VG","VGB","92",DateTimeOffset.Now}
                    ,
                    {"9ecb840b-85ec-4ab0-b368-53a59dc38b5c","Brunei","BN","BRN","96",DateTimeOffset.Now}
                    ,
                    {"025b640b-80df-4ce2-a018-1fefff75aa5f","Bulgaria","BG","BGR","100",DateTimeOffset.Now}
                    ,
                    {"dc758e1f-7136-4494-91b8-e43ceecf35ca","Burkina Faso","BF","BFA","854",DateTimeOffset.Now}
                    ,
                    {"ed7874ea-8b58-4ae7-8d97-223ca2884f7c","Burundi","BI","BDI","108",DateTimeOffset.Now}
                    ,
                    {"dc8deb14-d7a6-4829-8af2-6b5d59e62450","Cambodia","KH","KHM","116",DateTimeOffset.Now}
                    ,
                    {"9a5cca1a-c9bd-44db-9e8b-4717bfbe3bda","Cameroon","CM","CMR","120",DateTimeOffset.Now}
                    ,
                    {"0793538f-e7cc-4a41-80a4-8fd22660c7da","Canada","CA","CAN","124",DateTimeOffset.Now}
                    ,
                    {"22ca70e2-9d6e-440b-b044-e09d678fa5bd","Cape Verde","CV","CPV","132",DateTimeOffset.Now}
                    ,
                    {"2d2b8fc6-15a3-4875-9624-6f6dd3e120e6","Caribbean Netherlands","BQ","BES","535",DateTimeOffset.Now}
                    ,
                    {"db12409c-3fbf-4788-a44e-b1a7581c3da4","Cayman Islands","KY","CYM","136",DateTimeOffset.Now}
                    ,
                    {"83ada848-fecf-4667-aacc-6876b1fcbb14","Central African Republic","CF","CAF","140",DateTimeOffset.Now}
                    ,
                    {"9c1d3834-3af9-4e8e-8bc0-d2d2b3fb628e","Chad","TD","TCD","148",DateTimeOffset.Now}
                    ,
                    {"a3fdbeb2-4d00-4536-aab1-352848d24637","Chile","CL","CHL","152",DateTimeOffset.Now}
                    ,
                    {"a2ace964-a183-426f-9e96-2ecd2c223b48","China","CN","CHN","156",DateTimeOffset.Now}
                    ,
                    {"337d4bb8-48e1-4300-8b55-ebcf3e1f959d","Christmas Island","CX","CXR","162",DateTimeOffset.Now}
                    ,
                    {"9d17d6f5-b35d-428d-bf3d-e312fee73edf","Cocos (Keeling) Islands","CC","CCK","166",DateTimeOffset.Now}
                    ,
                    {"fa88ad3e-d64f-4403-aee8-44c583964a81","Colombia","CO","COL","170",DateTimeOffset.Now}
                    ,
                    {"d2ea25a6-d58c-4348-9821-f5303942c7fa","Comoros","KM","COM","174",DateTimeOffset.Now}
                    ,
                    {"b8e57c86-e4e6-4ebc-b296-669784209d41","DR Congo","CD","COD","180",DateTimeOffset.Now}
                    ,
                    {"2a456ea2-c5fb-4e83-bfc4-c162afbeaf0e","Cook Islands","CK","COK","184",DateTimeOffset.Now}
                    ,
                    {"fc1dac98-4662-48e5-a38b-02dec04e61ff","Costa Rica","CR","CRI","188",DateTimeOffset.Now}
                    ,
                    {"7bf77579-31d8-4711-b1dc-37c97899b12b","Croatia","HR","HRV","191",DateTimeOffset.Now}
                    ,
                    {"bff0419a-f0c9-4702-a9f6-873e81d76bbf","Cuba","CU","CUB","192",DateTimeOffset.Now}
                    ,
                    {"6653fb7f-a878-4cc3-8655-71cacd1f4d0f","Curaçao","CW","CUW","531",DateTimeOffset.Now}
                    ,
                    {"df6ff353-bf88-4f06-869a-4ed5488ede8c","Cyprus","CY","CYP","196",DateTimeOffset.Now}
                    ,
                    {"2554aaa4-a2fc-4152-a988-72e4e934dc63","Czechia","CZ","CZE","203",DateTimeOffset.Now}
                    ,
                    {"9083cc27-2069-4f6e-aa06-e816bb99bf1b","Denmark","DK","DNK","208",DateTimeOffset.Now}
                    ,
                    {"a687730f-8adb-4296-8b79-aaef307e28f9","Djibouti","DJ","DJI","262",DateTimeOffset.Now}
                    ,
                    {"2535926f-7e75-4d55-9cb6-39df104fb3c3","Dominica","DM","DMA","212",DateTimeOffset.Now}
                    ,
                    {"884f1d96-f0a3-4750-a7b7-825946f8763a","Dominican Republic","DO","DOM","214",DateTimeOffset.Now}
                    ,
                    {"51ca4551-1104-47a1-a70f-a998a3f706ea","Ecuador","EC","ECU","218",DateTimeOffset.Now}
                    ,
                    {"6277c849-2b45-4958-923f-966d88a8296e","Egypt","EG","EGY","818",DateTimeOffset.Now}
                    ,
                    {"3106aa73-3daf-46d0-a57b-9d7dc4998ee8","El Salvador","SV","SLV","222",DateTimeOffset.Now}
                    ,
                    {"6696ed33-d816-4d83-9ed4-f64bb5144425","Equatorial Guinea","GQ","GNQ","226",DateTimeOffset.Now}
                    ,
                    {"860bf436-6a6b-437c-9940-ca8f60374a82","Eritrea","ER","ERI","232",DateTimeOffset.Now}
                    ,
                    {"1bcbc637-9d6c-4aea-af83-8ae1a5012969","Estonia","EE","EST","233",DateTimeOffset.Now}
                    ,
                    {"2e1303cd-e3e3-4458-9186-3a289a4657eb","Ethiopia","ET","ETH","231",DateTimeOffset.Now}
                    ,
                    {"9e652f7f-7371-4eaa-86cf-63e8724aaf9a","Falkland Islands","FK","FLK","238",DateTimeOffset.Now}
                    ,
                    {"97a6cb5c-fd95-4679-b72b-7da032ba26e9","Faroe Islands","FO","FRO","234",DateTimeOffset.Now}
                    ,
                    {"93aea0df-6e02-49a8-b4b1-a038525cede2","Fiji","FJ","FJI","242",DateTimeOffset.Now}
                    ,
                    {"d0a6a7a2-b7f6-4f69-8f0c-9f21a0e71faf","Finland","FI","FIN","246",DateTimeOffset.Now}
                    ,
                    {"db8f6d2d-e71a-42bf-8f97-e05a2be812f3","France","FR","FRA","250",DateTimeOffset.Now}
                    ,
                    {"d1748139-7594-4b54-bd06-b5faf51bcdb3","French Guiana","GF","GUF","254",DateTimeOffset.Now}
                    ,
                    {"42debfc6-9c21-4f77-b085-6e7c7a650bb2","French Polynesia","PF","PYF","258",DateTimeOffset.Now}
                    ,
                    {"ac7ad8fc-c272-4894-b9f9-24553b7af384","French Southern and Antarctic Lands","TF","ATF","260",DateTimeOffset.Now}
                    ,
                    {"3a0ea176-9675-4586-b7b9-7dbcb0921f70","Gabon","GA","GAB","266",DateTimeOffset.Now}
                    ,
                    {"3c93543e-30f3-4eb0-8f76-17061ff7834c","Gambia","GM","GMB","270",DateTimeOffset.Now}
                    ,
                    {"213a2c5b-717a-46b5-9f9d-67942b21f6e8","Georgia","GE","GEO","268",DateTimeOffset.Now}
                    ,
                    {"193f7866-2d33-424c-98e8-c296aabb9fa9","Germany","DE","DEU","276",DateTimeOffset.Now}
                    ,
                    {"38e90e00-7486-4a2f-9f51-62e72b942e1b","Ghana","GH","GHA","288",DateTimeOffset.Now}
                    ,
                    {"cb699b96-dfdb-4482-9f6f-5d8c7f003048","Gibraltar","GI","GIB","292",DateTimeOffset.Now}
                    ,
                    {"1dc18718-eb7a-4cfe-a1c1-082e32bc0b01","Greece","GR","GRC","300",DateTimeOffset.Now}
                    ,
                    {"3baf616c-32e1-46b2-9f4d-22d9ca6cbb4d","Greenland","GL","GRL","304",DateTimeOffset.Now}
                    ,
                    {"7332b0a2-3e7c-426f-800a-75f9353d86a1","Grenada","GD","GRD","308",DateTimeOffset.Now}
                    ,
                    {"7c0d3c6c-bbab-4360-8ec9-82de8d5e791d","Guadeloupe","GP","GLP","312",DateTimeOffset.Now}
                    ,
                    {"7270e9ec-4d0e-4bcb-be35-adf5d363e791","Guam","GU","GUM","316",DateTimeOffset.Now}
                    ,
                    {"a0d52371-8435-4d55-9c8a-ab73d184f561","Guatemala","GT","GTM","320",DateTimeOffset.Now}
                    ,
                    {"ded22628-edc0-4f8b-a4bf-8bc27fcc0777","Guernsey","GG","GGY","831",DateTimeOffset.Now}
                    ,
                    {"3e2e1a75-8f76-4330-80d9-c135fad46e35","Guinea-Bissau","GW","GNB","624",DateTimeOffset.Now}
                    ,
                    {"2e3b19d4-10d6-4af7-a446-11d8ef6d48da","Guinea","GN","GIN","324",DateTimeOffset.Now}
                    ,
                    {"374dc265-08dc-4492-80a3-a4de0870445f","Guyana","GY","GUY","328",DateTimeOffset.Now}
                    ,
                    {"fac56cfa-21f5-4b8d-9bcb-c50330f25f15","Haiti","HT","HTI","332",DateTimeOffset.Now}
                    ,
                    {"49fb1ca1-5263-4a10-bd5c-2764b7c12b7d","Heard Island and McDonald Islands","HM","HMD","334",DateTimeOffset.Now}
                    ,
                    {"4e1aef48-d3f0-493d-92c7-21261466531c","Honduras","HN","HND","340",DateTimeOffset.Now}
                    ,
                    {"57b17dee-b014-4c82-8140-34652dcbcf13","Hong Kong","HK","HKG","344",DateTimeOffset.Now}
                    ,
                    {"da435307-ba56-43dc-9a8f-f56222affebf","Hungary","HU","HUN","348",DateTimeOffset.Now}
                    ,
                    {"0c5a46af-576d-430a-b601-22778ba00af2","Iceland","IS","ISL","352",DateTimeOffset.Now}
                    ,
                    {"189b0871-8b24-419e-9f35-bfb028dbd005","India","IN","IND","356",DateTimeOffset.Now}
                    ,
                    {"a0aea11b-aaed-4754-828f-ebc71d08c31f","Indonesia","ID","IDN","360",DateTimeOffset.Now}
                    ,
                    {"cc5da383-5f97-4247-b9fe-7e9b6998d52c","Iran","IR","IRN","364",DateTimeOffset.Now}
                    ,
                    {"a2a07201-b346-4e63-8fc8-0e044f6a3100","Iraq","IQ","IRQ","368",DateTimeOffset.Now}
                    ,
                    {"cbd07fd5-876d-408e-9009-f5aa16a89a3e","Ireland","IE","IRL","372",DateTimeOffset.Now}
                    ,
                    {"d11e7129-ccb3-436f-958e-40ee68250e57","Isle of Man","IM","IMN","833",DateTimeOffset.Now}
                    ,
                    {"e04e5e80-ac0d-4864-b73a-16f92be03b98","Israel","IL","ISR","376",DateTimeOffset.Now}
                    ,
                    {"8051f4c2-7266-45cc-94d0-cda4e4b6b2e8","Italy","IT","ITA","380",DateTimeOffset.Now}
                    ,
                    {"cb31598e-086d-41fe-9b28-517fdc05086a","Ivory Coast","CI","CIV","384",DateTimeOffset.Now}
                    ,
                    {"7a424b4d-98e3-4b2d-ac6a-f91b64e9de9c","Jamaica","JM","JAM","388",DateTimeOffset.Now}
                    ,
                    {"6e40b858-23b0-49bb-891b-38fdd48390a1","Japan","JP","JPN","392",DateTimeOffset.Now}
                    ,
                    {"ff3994f7-30fa-437f-96ad-ce02c73819ff","Jersey","JE","JEY","832",DateTimeOffset.Now}
                    ,
                    {"3b14cbae-18ee-4061-9b87-df59527c648c","Jordan","JO","JOR","400",DateTimeOffset.Now}
                    ,
                    {"a96c4622-1155-4dc8-82f8-d4dd3765e9d2","Kazakhstan","KZ","KAZ","398",DateTimeOffset.Now}
                    ,
                    {"a0573190-e86f-489e-8e05-87fdba1d442f","Kenya","KE","KEN","404",DateTimeOffset.Now}
                    ,
                    {"858cee80-e6e8-4047-954d-e2eeb9d69c29","Kiribati","KI","KIR","296",DateTimeOffset.Now}
                    ,
                    {"5ddcbf09-25d4-4c85-80a1-f888f0d91a59","Kuwait","KW","KWT","414",DateTimeOffset.Now}
                    ,
                    {"455b45ad-26b5-4e95-8a64-d56865b1524d","Kyrgyzstan","KG","KGZ","417",DateTimeOffset.Now}
                    ,
                    {"c8daf0db-2ee5-487c-ad4d-daa59e16bf5f","Laos","LA","LAO","418",DateTimeOffset.Now}
                    ,
                    {"e6659376-9bb2-42a5-9c9f-5bae7ef585bd","Latvia","LV","LVA","428",DateTimeOffset.Now}
                    ,
                    {"87395857-20ea-4d19-ab00-768e04b8c763","Lebanon","LB","LBN","422",DateTimeOffset.Now}
                    ,
                    {"8ac6e42a-c3f1-479d-b335-064138d3892a","Lesotho","LS","LSO","426",DateTimeOffset.Now}
                    ,
                    {"224ea6e3-03ee-49f0-85a3-aa5aaa664673","Liberia","LR","LBR","430",DateTimeOffset.Now}
                    ,
                    {"4475bb0b-d833-4838-a527-f457b4aeae03","Libya","LY","LBY","434",DateTimeOffset.Now}
                    ,
                    {"826f55ae-26d9-4e92-8ff7-cdb6baa01fc4","Liechtenstein","LI","LIE","438",DateTimeOffset.Now}
                    ,
                    {"d15ba910-8685-4f48-912f-4b7f4cec339d","Lithuania","LT","LTU","440",DateTimeOffset.Now}
                    ,
                    {"217abebb-d717-4b0b-9da8-08f7742802a0","Luxembourg","LU","LUX","442",DateTimeOffset.Now}
                    ,
                    {"61e8acf6-fe38-449b-a80c-b2d2de0a06a2","Macau","MO","MAC","446",DateTimeOffset.Now}
                    ,
                    {"88550902-d519-480f-8d3a-1537ab3ceea9","Madagascar","MG","MDG","450",DateTimeOffset.Now}
                    ,
                    {"1bfde6a1-6b2a-4c0e-9be6-5c7c6f2632e9","Malawi","MW","MWI","454",DateTimeOffset.Now}
                    ,
                    {"daabae09-2df5-47b0-8579-3ad458ee76fc","Malaysia","MY","MYS","458",DateTimeOffset.Now}
                    ,
                    {"c37404c9-40b1-49ef-b451-49e0c764d5fd","Maldives","MV","MDV","462",DateTimeOffset.Now}
                    ,
                    {"f3434e8c-0397-419c-bdd9-a98d7752bb9c","Mali","ML","MLI","466",DateTimeOffset.Now}
                    ,
                    {"c8ed836c-fecb-4d51-b137-cc77c9253dc5","Malta","MT","MLT","470",DateTimeOffset.Now}
                    ,
                    {"61b62814-51ed-4cb6-be6a-d7b5ae48b9f9","Marshall Islands","MH","MHL","584",DateTimeOffset.Now}
                    ,
                    {"8006aab3-92ef-423d-a3d4-c5e8bf0d9596","Martinique","MQ","MTQ","474",DateTimeOffset.Now}
                    ,
                    {"60ada253-ce25-4d2b-8fdd-f2e6f80c372a","Mauritania","MR","MRT","478",DateTimeOffset.Now}
                    ,
                    {"d18b427a-b963-46c5-aec1-245a11c8b882","Mauritius","MU","MUS","480",DateTimeOffset.Now}
                    ,
                    {"f22d2cdb-5c0e-49cc-8b5a-9a25c5273ae7","Mayotte","YT","MYT","175",DateTimeOffset.Now}
                    ,
                    {"25b0fa7e-6a4f-467a-b512-cc817d9d0087","Mexico","MX","MEX","484",DateTimeOffset.Now}
                    ,
                    {"6bd42521-056b-4a84-9c30-ef2dafc778ab","Micronesia","FM","FSM","583",DateTimeOffset.Now}
                    ,
                    {"dd5879da-d363-4619-a478-4c3686a9d457","Moldova","MD","MDA","498",DateTimeOffset.Now}
                    ,
                    {"7a8b7e61-f049-4f57-9c6b-f139a65e979a","Monaco","MC","MCO","492",DateTimeOffset.Now}
                    ,
                    {"f98853fc-da8d-4d92-ac4d-b5ab5128af88","Mongolia","MN","MNG","496",DateTimeOffset.Now}
                    ,
                    {"ca9fc03d-382e-4aff-8c60-99531037fb5e","Montenegro","ME","MNE","499",DateTimeOffset.Now}
                    ,
                    {"66c0f758-f6de-41b2-abb3-302cb103caf2","Montserrat","MS","MSR","500",DateTimeOffset.Now}
                    ,
                    {"87ef8004-0407-4779-8c5d-f5fd45d2dc75","Morocco","MA","MAR","504",DateTimeOffset.Now}
                    ,
                    {"96ff7073-fde0-4c70-a56b-b7e1256568c0","Mozambique","MZ","MOZ","508",DateTimeOffset.Now}
                    ,
                    {"4f15d554-5086-4d5c-8b81-592b65428eb5","Myanmar","MM","MMR","104",DateTimeOffset.Now}
                    ,
                    {"433741db-ed8a-45db-b5fc-af0f96399a10","Namibia","NA","NAM","516",DateTimeOffset.Now}
                    ,
                    {"938c909b-9a86-4a3c-8a7e-8ae7e77b9e50","Nauru","NR","NRU","520",DateTimeOffset.Now}
                    ,
                    {"84e6cd7e-2ba6-4008-a19e-06b2cf464776","Nepal","NP","NPL","524",DateTimeOffset.Now}
                    ,
                    {"57b73f36-ce3e-421f-ad41-3ec7939f2faa","Netherlands","NL","NLD","528",DateTimeOffset.Now}
                    ,
                    {"49afda12-15c3-4fc5-8b93-e12818afb78d","New Caledonia","NC","NCL","540",DateTimeOffset.Now}
                    ,
                    {"7a0898e4-dcac-456d-a469-c16ed247bca8","New Zealand","NZ","NZL","554",DateTimeOffset.Now}
                    ,
                    {"866b51be-af49-4f6e-bf88-13bc18329f18","Nicaragua","NI","NIC","558",DateTimeOffset.Now}
                    ,
                    {"2ba19f1d-998f-40ee-9af6-c6ab562e3040","Nigeria","NG","NGA","566",DateTimeOffset.Now}
                    ,
                    {"a1e7fc37-9a98-4f38-a2ed-9e67ab6f104b","Niger","NE","NER","562",DateTimeOffset.Now}
                    ,
                    {"a37a630f-d2e7-4ec0-a858-15d42675e0e5","Niue","NU","NIU","570",DateTimeOffset.Now}
                    ,
                    {"abffbc54-0791-45cc-b8bb-aa582928f607","Norfolk Island","NF","NFK","574",DateTimeOffset.Now}
                    ,
                    {"d0c3560b-4d83-4923-aa14-c69f2e1b1410","Northern Mariana Islands","MP","MNP","580",DateTimeOffset.Now}
                    ,
                    {"490591d9-c44a-4960-acce-3d1cb126881c","North Korea","KP","PRK","408",DateTimeOffset.Now}
                    ,
                    {"b42536ca-fbac-4412-bf62-da5f262f1213","North Macedonia","MK","MKD","807",DateTimeOffset.Now}
                    ,
                    {"6c160616-7c35-4fba-8b06-a982a888c57b","Norway","NO","NOR","578",DateTimeOffset.Now}
                    ,
                    {"fa540e8c-d937-437c-9595-444593d74d83","Oman","OM","OMN","512",DateTimeOffset.Now}
                    ,
                    {"3fc4e23c-0316-470e-a89f-cee6ccf60558","Pakistan","PK","PAK","586",DateTimeOffset.Now}
                    ,
                    {"594e2644-46dd-4e45-904c-0ee5ea46e12e","Palau","PW","PLW","585",DateTimeOffset.Now}
                    ,
                    {"a75e2a12-59c1-4d2a-bc2d-e25bba4ce88e","Palestine","PS","PSE","275",DateTimeOffset.Now}
                    ,
                    {"823063a7-3e0b-4995-be71-6b42659a5fe0","Panama","PA","PAN","591",DateTimeOffset.Now}
                    ,
                    {"022a18d8-f90c-427e-b424-e3edb636f527","Papua New Guinea","PG","PNG","598",DateTimeOffset.Now}
                    ,
                    {"d4dce7eb-97d1-4e16-84c2-950a8e0eb0a1","Paraguay","PY","PRY","600",DateTimeOffset.Now}
                    ,
                    {"6731825b-e068-456d-bb1a-376f3f99653c","Peru","PE","PER","604",DateTimeOffset.Now}
                    ,
                    {"a8beebbd-cbdb-4693-9350-a224e61793fe","Philippines","PH","PHL","608",DateTimeOffset.Now}
                    ,
                    {"16b20a33-686b-491e-b7fb-c6c3866c8644","Pitcairn Islands","PN","PCN","612",DateTimeOffset.Now}
                    ,
                    {"e72f9ea5-d3bd-44d0-8406-efb2b76c722a","Poland","PL","POL","616",DateTimeOffset.Now}
                    ,
                    {"ec0171f1-5a34-4428-bbf0-c8f2ce01620d","Portugal","PT","PRT","620",DateTimeOffset.Now}
                    ,
                    {"26126a25-e870-47cc-b2f1-9da0a90e83a5","Puerto Rico","PR","PRI","630",DateTimeOffset.Now}
                    ,
                    {"1b3048b2-d950-46ea-95ac-ac6960040f1f","Qatar","QA","QAT","634",DateTimeOffset.Now}
                    ,
                    {"58a14d6d-2b26-44f4-9716-f330d4edc83c","Republic of the Congo","CG","COG","178",DateTimeOffset.Now}
                    ,
                    {"cd054300-3d81-4c6f-8734-cf1d8c0c671d","Réunion","RE","REU","638",DateTimeOffset.Now}
                    ,
                    {"83c34cf2-a42c-41b6-be63-b4df5c51a4f7","Romania","RO","ROU","642",DateTimeOffset.Now}
                    ,
                    {"6b92215d-32db-4014-83de-64e44d9a652f","Russia","RU","RUS","643",DateTimeOffset.Now}
                    ,
                    {"b46ed2bd-45f9-495a-be1e-264dd2a73bd6","Rwanda","RW","RWA","646",DateTimeOffset.Now}
                    ,
                    {"8499fbe8-6462-43c5-9714-af6e8f51aaf9","Saint Barthélemy","BL","BLM","652",DateTimeOffset.Now}
                    ,
                    {"22ed84ad-10db-4112-8946-75dcf65be329","Saint Helena, Ascension and Tristan da Cunha","SH","SHN","654",DateTimeOffset.Now}
                    ,
                    {"38233ba2-6f16-4adb-bb80-3aff58a9d98e","Saint Kitts and Nevis","KN","KNA","659",DateTimeOffset.Now}
                    ,
                    {"a459954c-d665-4424-a8e2-79eb63c74c0f","Saint Lucia","LC","LCA","662",DateTimeOffset.Now}
                    ,
                    {"13746d28-ac9e-49d3-8cb8-390eed4fe5c4","Saint Martin","MF","MAF","663",DateTimeOffset.Now}
                    ,
                    {"7626ac97-026a-40c5-b8b7-f332d8b3e1df","Saint Pierre and Miquelon","PM","SPM","666",DateTimeOffset.Now}
                    ,
                    {"dcc1db18-3699-4a65-8488-5a4f5320b80d","Saint Vincent and the Grenadines","VC","VCT","670",DateTimeOffset.Now}
                    ,
                    {"716ee38a-6251-4f00-a48e-9c29d3cafb8c","Samoa","WS","WSM","882",DateTimeOffset.Now}
                    ,
                    {"124e5ac7-fd14-46be-a955-b6f161f5cb35","San Marino","SM","SMR","674",DateTimeOffset.Now}
                    ,
                    {"aa751bf0-319a-4beb-b4e4-7256d5f1a213","São Tomé and Príncipe","ST","STP","678",DateTimeOffset.Now}
                    ,
                    {"f612be2e-777c-4c48-b871-15960de263ec","Saudi Arabia","SA","SAU","682",DateTimeOffset.Now}
                    ,
                    {"dd273bda-e19e-459f-80b4-8e7aa21cef75","Senegal","SN","SEN","686",DateTimeOffset.Now}
                    ,
                    {"3ec2fb85-766c-4b3e-80a3-e3c75344e764","Serbia","RS","SRB","688",DateTimeOffset.Now}
                    ,
                    {"cc93f900-1b0c-4f28-917b-85030a478d79","Seychelles","SC","SYC","690",DateTimeOffset.Now}
                    ,
                    {"20ec9de4-7a0f-4c97-a72f-705774993b64","Sierra Leone","SL","SLE","694",DateTimeOffset.Now}
                    ,
                    {"c13e8f01-0b39-406e-8a5f-acc451c08777","Singapore","SG","SGP","702",DateTimeOffset.Now}
                    ,
                    {"b91a9dd8-0de6-4737-a1de-dabceceacefe","Sint Maarten","SX","SXM","534",DateTimeOffset.Now}
                    ,
                    {"71328869-1bd4-4758-a6f3-14f276ff9a15","Slovakia","SK","SVK","703",DateTimeOffset.Now}
                    ,
                    {"c68271a5-7e4d-4635-acf2-b72d831cd614","Slovenia","SI","SVN","705",DateTimeOffset.Now}
                    ,
                    {"f53d34e3-da67-497a-b120-d2032609b36e","Solomon Islands","SB","SLB","90",DateTimeOffset.Now}
                    ,
                    {"24763389-7c4c-4438-81e3-aa730e27bde7","Somalia","SO","SOM","706",DateTimeOffset.Now}
                    ,
                    {"bab77522-001d-42cb-a1ee-394e16ee5613","South Africa","ZA","ZAF","710",DateTimeOffset.Now}
                    ,
                    {"3b6d4a37-55fd-4997-b0f4-fc882ecdbba8","South Georgia","GS","SGS","239",DateTimeOffset.Now}
                    ,
                    {"4af9cc44-18de-4711-a63c-dce425975954","South Korea","KR","KOR","410",DateTimeOffset.Now}
                    ,
                    {"21bb56c8-782c-45cd-994e-fe387f8b0a2c","South Sudan","SS","SSD","728",DateTimeOffset.Now}
                    ,
                    {"a5a45205-c646-4336-9e61-3259262a02f0","Spain","ES","ESP","724",DateTimeOffset.Now}
                    ,
                    {"114232b3-c958-4f9e-9c14-7d99a6249e71","Sri Lanka","LK","LKA","144",DateTimeOffset.Now}
                    ,
                    {"db2926f9-150e-4adf-bebb-9b29d455684e","Sudan","SD","SDN","729",DateTimeOffset.Now}
                    ,
                    {"210c3ab2-89e4-42af-ac1e-9a21f34d5c71","Suriname","SR","SUR","740",DateTimeOffset.Now}
                    ,
                    {"ba0dcec6-e7da-46fe-9cff-f2d6d5e5f074","Svalbard and Jan Mayen","SJ","SJM","744",DateTimeOffset.Now}
                    ,
                    {"3ebb2e9d-085a-4d9e-8a10-15b676cda6e0","Eswatini","SZ","SWZ","748",DateTimeOffset.Now}
                    ,
                    {"98a66f78-1949-4835-8d1e-00bee53e36c6","Sweden","SE","SWE","752",DateTimeOffset.Now}
                    ,
                    {"adcdcc45-a295-4d92-88d4-c318a256e714","Switzerland","CH","CHE","756",DateTimeOffset.Now}
                    ,
                    {"1db37e3f-799e-430e-b504-910f37a68df9","Syria","SY","SYR","760",DateTimeOffset.Now}
                    ,
                    {"0808098b-9994-49bb-a416-02efc74d69ad","Taiwan","TW","TWN","158",DateTimeOffset.Now}
                    ,
                    {"e3807344-73e5-41fb-a0f7-6cf1e02c63cf","Tajikistan","TJ","TJK","762",DateTimeOffset.Now}
                    ,
                    {"0932e8a6-653f-4be8-b08f-048a0e7a4231","Tanzania","TZ","TZA","834",DateTimeOffset.Now}
                    ,
                    {"83173f45-c4b1-4ccc-a967-c84f23685a35","Thailand","TH","THA","764",DateTimeOffset.Now}
                    ,
                    {"6ed51acb-226d-419a-8131-047d6bf94e15","Timor-Leste","TL","TLS","626",DateTimeOffset.Now}
                    ,
                    {"190e6963-3b52-4a98-9e7e-15d737b7ad3b","Togo","TG","TGO","768",DateTimeOffset.Now}
                    ,
                    {"9b94a444-0ca8-4622-9ff4-e9590c0fe90e","Tokelau","TK","TKL","772",DateTimeOffset.Now}
                    ,
                    {"dd636575-4adf-4ab3-bbe7-b7856c5e28a1","Tonga","TO","TON","776",DateTimeOffset.Now}
                    ,
                    {"adfe5723-b858-492c-b110-bb0807a11da1","Trinidad and Tobago","TT","TTO","780",DateTimeOffset.Now}
                    ,
                    {"cceffd4e-69dd-4afa-8106-803485970177","Tunisia","TN","TUN","788",DateTimeOffset.Now}
                    ,
                    {"8d266a94-4100-40df-bfc5-c5eac4fc5d3f","Turkey","TR","TUR","792",DateTimeOffset.Now}
                    ,
                    {"ab942134-c661-4ac2-98dd-dfed69969d42","Turkmenistan","TM","TKM","795",DateTimeOffset.Now}
                    ,
                    {"147aca9c-5e54-4076-9877-6e35ec206b41","Turks and Caicos Islands","TC","TCA","796",DateTimeOffset.Now}
                    ,
                    {"229c66d5-57e8-4b2a-b86d-02434c78e1e6","Tuvalu","TV","TUV","798",DateTimeOffset.Now}
                    ,
                    {"18d5202e-7871-48f0-85f5-fdebc25897ce","Uganda","UG","UGA","800",DateTimeOffset.Now}
                    ,
                    {"4949ddad-5b9c-4025-a4a6-1f15ebd58a3f","Ukraine","UA","UKR","804",DateTimeOffset.Now}
                    ,
                    {"8830916f-d073-4b92-b352-77d99533a780","United Arab Emirates","AE","ARE","784",DateTimeOffset.Now}
                    ,
                    {"59e43a39-6dcd-4477-8ce3-748008d3fcad","United Kingdom","GB","GBR","826",DateTimeOffset.Now}
                    ,
                    {"d34979c9-15d9-4d9f-8775-001e292aacc4","United States","US","USA","840",DateTimeOffset.Now}
                    ,
                    {"aac82345-e9cd-453c-997e-b5a5bb3c5fdd","United States Minor Outlying Islands","UM","UMI","581",DateTimeOffset.Now}
                    ,
                    {"244b48d9-df89-44d4-95b1-c2a931281770","United States Virgin Islands","VI","VIR","850",DateTimeOffset.Now}
                    ,
                    {"3fb86a9b-04ee-4b08-b833-1f7a53ba6705","Uruguay","UY","URY","858",DateTimeOffset.Now}
                    ,
                    {"05eb50b0-62a5-4b60-a236-8dd19c2b6108","Uzbekistan","UZ","UZB","860",DateTimeOffset.Now}
                    ,
                    {"5321234c-9063-48e4-b081-0335bf6881b5","Vanuatu","VU","VUT","548",DateTimeOffset.Now}
                    ,
                    {"633e1b2c-49bf-4f11-9a54-223448bbc256","Vatican City","VA","VAT","336",DateTimeOffset.Now}
                    ,
                    {"10e31f93-2656-4270-88d8-a7a69e7ad4fb","Venezuela","VE","VEN","862",DateTimeOffset.Now}
                    ,
                    {"7236389c-c18b-48ff-9b92-987ffdf1b657","Vietnam","VN","VNM","704",DateTimeOffset.Now}
                    ,
                    {"9194235d-edee-4596-b71b-ac8348be94e9","Wallis and Futuna","WF","WLF","876",DateTimeOffset.Now}
                    ,
                    {"95eacfa8-aa84-40ef-8af6-85b9c260c120","Western Sahara","EH","ESH","732",DateTimeOffset.Now}
                    ,
                    {"7ee13f71-b586-4645-a36a-72f760bab065","Yemen","YE","YEM","887",DateTimeOffset.Now}
                    ,
                    {"a5a4db1c-7e8e-4ef7-b3d5-448c8a5c2bc0","Zambia","ZM","ZMB","894",DateTimeOffset.Now}
                    ,
                    {"a6205437-3808-4c11-b4b0-54f6179b1746","Zimbabwe","ZW","ZWE","716",DateTimeOffset.Now}
                    ,
                    {"0EFB07E6-6634-46DE-A98D-A85BF331C20E","Worldwide","WW","WWE","000",DateTimeOffset.Now}

            },
            schema: "Lookup");

            migrationBuilder.InsertData(
            table: "Gender",
            columns: new[] { "Id", "Name", "DateCreated" },
            values: new object[,]
            {
                    {"6DBD31E9-5196-49CA-8D3B-8354A9BFF996","Male",DateTimeOffset.Now}
                    ,
                    {"6342C98A-0572-4E6A-A4FB-A1AEAFD3C053","Female",DateTimeOffset.Now}
                    ,
                    {"1BDCBFAD-67AA-4556-A326-5D263761F920","Non-Binary",DateTimeOffset.Now}
                    ,
                    {"0BE24DF8-D4C5-453C-AADF-EEDF673E1FE3","Other",DateTimeOffset.Now}
                    ,
                    {"26BA24A5-9209-48B2-A885-95C43EF142B5","Prefer not to say",DateTimeOffset.Now}
            },
            schema: "Lookup");

            migrationBuilder.InsertData(
            table: "Language",
            columns: new[] { "Id", "Name", "CodeAlpha2", "DateCreated" },
            values: new object[,]
            {
                    {"86FA3FF2-F3C7-43CE-B6A2-22C46EA22112" ,"Abkhazian" ,"AB", DateTimeOffset.Now}
                    ,
                    {"7F524E66-28E9-4421-9166-1345C6EB6FD6" ,"Afar" ,"AA", DateTimeOffset.Now}
                    ,
                    {"1D348660-1C76-4698-97DF-5FE1D6DD14FB" ,"Afrikaans" ,"AF", DateTimeOffset.Now}
                    ,
                    {"13299E24-B887-4342-B407-F6CBDAE8F7AC" ,"Akan" ,"AK", DateTimeOffset.Now}
                    ,
                    {"C0FAA6D1-0A0A-4E91-BF71-CF96C3754217" ,"Albanian" ,"SQ", DateTimeOffset.Now}
                    ,
                    {"E7202ABB-F03F-4EDF-AE4C-CF0743E92416" ,"Amharic" ,"AM", DateTimeOffset.Now}
                    ,
                    {"9FB76965-E0B3-471E-BDC0-91CB4DE82AA5" ,"Arabic" ,"AR", DateTimeOffset.Now}
                    ,
                    {"AB138F2A-EB47-4F47-BC02-2498D91B6A6F" ,"Aragonese" ,"AN", DateTimeOffset.Now}
                    ,
                    {"6EB2F511-3301-41A3-A6AB-F0C8FBB603EE" ,"Armenian" ,"HY", DateTimeOffset.Now}
                    ,
                    {"174C9FD5-3CC7-4E64-AD4F-E624972411C1" ,"Assamese" ,"AS", DateTimeOffset.Now}
                    ,
                    {"4258B0CE-F99E-4033-828D-3BBB938965E1" ,"Avaric" ,"AV", DateTimeOffset.Now}
                    ,
                    {"BFD381B5-E094-44AF-BEC2-E6A96762FA4C" ,"Avestan" ,"AE", DateTimeOffset.Now}
                    ,
                    {"ED7B5FA8-2C94-4425-854B-BE32CE05D690" ,"Aymara" ,"AY", DateTimeOffset.Now}
                    ,
                    {"AA566553-CC3F-467B-B5C7-4099742ED931" ,"Azerbaijani" ,"AZ", DateTimeOffset.Now}
                    ,
                    {"3F21A510-3616-4093-980F-64D47ECA6CC1" ,"Bambara" ,"BM", DateTimeOffset.Now}
                    ,
                    {"5793ED67-3974-4BD8-B338-99D67DB769FD" ,"Bashkir" ,"BA", DateTimeOffset.Now}
                    ,
                    {"635A80BC-DF8B-4B8C-A923-3D5742EBE863" ,"Basque" ,"EU", DateTimeOffset.Now}
                    ,
                    {"0B6F9A26-FFF2-49DD-909F-19B6ADDB6D52" ,"Belarusian" ,"BE", DateTimeOffset.Now}
                    ,
                    {"3DEDAAFB-6E2B-4BF8-907C-A5273CCF41AE" ,"Bengali" ,"BN", DateTimeOffset.Now}
                    ,
                    {"B8489D5F-3AE4-4BE6-A1D7-348AD8430470" ,"Bislama" ,"BI", DateTimeOffset.Now}
                    ,
                    {"ADA89F50-438D-436E-B9BE-6F5F2A05CEEE" ,"Bosnian" ,"BS", DateTimeOffset.Now}
                    ,
                    {"B8F2F45E-E216-478A-903B-E01B386B2AD0" ,"Breton" ,"BR", DateTimeOffset.Now}
                    ,
                    {"53CB35BF-15EF-4076-90E0-372BCA32BB1E" ,"Bulgarian" ,"BG", DateTimeOffset.Now}
                    ,
                    {"DF361163-48DB-4FFF-93E4-48BAC94AD3FA" ,"Burmese" ,"MY", DateTimeOffset.Now}
                    ,
                    {"456161DE-61A7-4C6C-9C87-2B78B8674DFD" ,"Catalan, Valencian" ,"CA", DateTimeOffset.Now}
                    ,
                    {"2BA84F27-7FB7-43A3-B8CF-499E722D77F4" ,"Chamorro" ,"CH", DateTimeOffset.Now}
                    ,
                    {"EFEFCF27-09CF-44B4-8753-288E298DAD70" ,"Chechen" ,"CE", DateTimeOffset.Now}
                    ,
                    {"F6B285FE-D540-4D42-92DE-67CBC93396A8" ,"Chichewa, Chewa, Nyanja" ,"NY", DateTimeOffset.Now}
                    ,
                    {"1AD605AC-3E17-4936-AE37-FDD18F3A2CFB" ,"Chinese" ,"ZH", DateTimeOffset.Now}
                    ,
                    {"D081ED37-D5CC-49C5-8635-2AAA9C501E87" ,"Church Slavonic, Old Slavonic, Old Church Slavonic" ,"CU", DateTimeOffset.Now}
                    ,
                    {"5CCC2BA5-B6B4-4239-AA92-C3F01283E5B2" ,"Chuvash" ,"CV", DateTimeOffset.Now}
                    ,
                    {"2F15BF8C-B7CD-40CC-BB11-4E5766189445" ,"Cornish" ,"KW", DateTimeOffset.Now}
                    ,
                    {"FB16A476-0B89-47A2-95E5-B048888BE296" ,"Corsican" ,"CO", DateTimeOffset.Now}
                    ,
                    {"43870A55-4F1F-44F7-A2FF-B2A09DF35A81" ,"Cree" ,"CR", DateTimeOffset.Now}
                    ,
                    {"F0F82A5C-A702-4CA9-9737-105A265310E7" ,"Croatian" ,"HR", DateTimeOffset.Now}
                    ,
                    {"6734609C-FAFA-4F5A-8D4B-BB495D7AA6F6" ,"Czech" ,"CS", DateTimeOffset.Now}
                    ,
                    {"56531126-A5FB-4DF9-AA54-D4E14041E989" ,"Danish" ,"DA", DateTimeOffset.Now}
                    ,
                    {"496A3547-3FD7-49F5-B475-66BB649B5CE7" ,"Divehi, Dhivehi, Maldivian" ,"DV", DateTimeOffset.Now}
                    ,
                    {"6026E7BD-C5BB-4788-B096-16E5FE3EE350" ,"Dutch, Flemish" ,"NL", DateTimeOffset.Now}
                    ,
                    {"EFEB113D-B902-477C-834E-D6BE95655065" ,"Dzongkha" ,"DZ", DateTimeOffset.Now}
                    ,
                    {"867B61F1-D669-4A2C-BF22-65EBD084D0CD" ,"English" ,"EN", DateTimeOffset.Now}
                    ,
                    {"E37F2991-7333-4736-83FF-0BA39CBE1065" ,"Esperanto" ,"EO", DateTimeOffset.Now}
                    ,
                    {"4F300FE8-32EA-4F85-9557-4A6091890424" ,"Estonian" ,"ET", DateTimeOffset.Now}
                    ,
                    {"FCDB8957-A61A-4B79-8141-824D72666EF9" ,"Ewe" ,"EE", DateTimeOffset.Now}
                    ,
                    {"EA821224-B8F5-4887-AC8F-E68135FEC0A9" ,"Faroese" ,"FO", DateTimeOffset.Now}
                    ,
                    {"20FCCE4C-5ADB-41B9-8FA8-3F469B1971ED" ,"Fijian" ,"FJ", DateTimeOffset.Now}
                    ,
                    {"EA684E6A-5F90-43D2-BB2D-4F02F04EADFC" ,"Finnish" ,"FI", DateTimeOffset.Now}
                    ,
                    {"39E6D00E-8F81-420F-A8D5-CDFC0D466A9D" ,"French" ,"FR", DateTimeOffset.Now}
                    ,
                    {"4538505C-5660-480B-80A4-BAE107525D9E" ,"Western Frisian" ,"FY", DateTimeOffset.Now}
                    ,
                    {"800E21CC-9FAD-451D-BC9E-166C7CD76F00" ,"Fulah" ,"FF", DateTimeOffset.Now}
                    ,
                    {"7A742523-0EEB-4D8B-B72C-313E898CB32E" ,"Gaelic, Scottish Gaelic" ,"GD", DateTimeOffset.Now}
                    ,
                    {"8BAEFCBF-4652-4A05-AD6F-BECA87329F5B" ,"Galician" ,"GL", DateTimeOffset.Now}
                    ,
                    {"F57C01D7-D46E-4070-A0DC-8E2573D34F1A" ,"Ganda" ,"LG", DateTimeOffset.Now}
                    ,
                    {"6DB09919-4C35-4CCC-86A2-A8BD4C6C00E5" ,"Georgian" ,"KA", DateTimeOffset.Now}
                    ,
                    {"AE449EF4-7375-4C86-B626-8F85D29A4249" ,"German" ,"DE", DateTimeOffset.Now}
                    ,
                    {"4E9EC14D-CE9B-4513-8AE3-3C80468F2500" ,"Greek, Modern (1453–)" ,"EL", DateTimeOffset.Now}
                    ,
                    {"00101BD1-7E43-4D91-97D6-6B52BEAD4F39" ,"Kalaallisut, Greenlandic" ,"KL", DateTimeOffset.Now}
                    ,
                    {"1A64D7F0-7971-4858-8559-77CFCC7462AE" ,"Guarani" ,"GN", DateTimeOffset.Now}
                    ,
                    {"4A40FA3E-2982-4F35-AF12-3E4A8905592D" ,"Gujarati" ,"GU", DateTimeOffset.Now}
                    ,
                    {"8FECA0FD-8B43-4BBF-AB04-D2B915948F2E" ,"Haitian, Haitian Creole" ,"HT", DateTimeOffset.Now}
                    ,
                    {"6C245FB3-CFEF-4AF9-85C2-219761104877" ,"Hausa" ,"HA", DateTimeOffset.Now}
                    ,
                    {"42F1BB9D-E021-47ED-8569-B71C3519F7A3" ,"Hebrew" ,"HE", DateTimeOffset.Now}
                    ,
                    {"B70EDC6B-D424-491A-A23B-1BBA4528C374" ,"Herero" ,"HZ", DateTimeOffset.Now}
                    ,
                    {"71DD1E57-2F3F-42C4-9F27-A2BF06595090" ,"Hindi" ,"HI", DateTimeOffset.Now}
                    ,
                    {"70E77492-F9B3-4A1A-965B-592C49BE0A44" ,"Hiri Motu" ,"HO", DateTimeOffset.Now}
                    ,
                    {"C577A688-2E51-4B42-8FE5-F0CD886B890F" ,"Hungarian" ,"HU", DateTimeOffset.Now}
                    ,
                    {"C2E54FEA-7C82-4EF5-BD63-890810374236" ,"Icelandic" ,"IS", DateTimeOffset.Now}
                    ,
                    {"BA2CCF38-A663-4811-93EB-1F981665D91B" ,"Ido" ,"IO", DateTimeOffset.Now}
                    ,
                    {"CA812D25-C726-4416-8D83-4499D3CE7949" ,"Igbo" ,"IG", DateTimeOffset.Now}
                    ,
                    {"95D7D113-160D-4E64-8BF4-669CEFF3AFE4" ,"Indonesian" ,"ID", DateTimeOffset.Now}
                    ,
                    {"07B9D739-11A8-4DF6-8D28-E93ABBE090D1" ,"Interlingua (International Auxiliary Language Association)" ,"IA", DateTimeOffset.Now}
                    ,
                    {"E102D217-46EA-4EE3-B672-96EDB3285580" ,"Interlingue, Occidental" ,"IE", DateTimeOffset.Now}
                    ,
                    {"96C11375-8B33-4091-B0A0-F1B0A8493422" ,"Inuktitut" ,"IU", DateTimeOffset.Now}
                    ,
                    {"EF29B5E2-3A1D-4439-91DC-ADB241CC17C9" ,"Inupiaq" ,"IK", DateTimeOffset.Now}
                    ,
                    {"9CDBC3BD-2A06-45CE-AB7C-F025B1E25DE8" ,"Irish" ,"GA", DateTimeOffset.Now}
                    ,
                    {"C17BC33C-7EE3-45D5-A742-53F914722103" ,"Italian" ,"IT", DateTimeOffset.Now}
                    ,
                    {"F04C7A36-8CDA-4E15-BC8A-ECD256F3AD88" ,"Japanese" ,"JA", DateTimeOffset.Now}
                    ,
                    {"6551848F-1C1F-45B6-8740-2BAE2F15079A" ,"Javanese" ,"JV", DateTimeOffset.Now}
                    ,
                    {"8D956B34-2F8A-48A7-8A2B-FB595D7B0842" ,"Kannada" ,"KN", DateTimeOffset.Now}
                    ,
                    {"13A83723-160A-42EF-A7E0-08E1A5124139" ,"Kanuri" ,"KR", DateTimeOffset.Now}
                    ,
                    {"7347C807-75AB-4F72-9C21-C9F7CBBAC6C3" ,"Kashmiri" ,"KS", DateTimeOffset.Now}
                    ,
                    {"B8D12498-1F9A-401E-958C-5F2427A13410" ,"Kazakh" ,"KK", DateTimeOffset.Now}
                    ,
                    {"2718639F-2A78-482C-B90D-51E4B0D68FB6" ,"Central Khmer" ,"KM", DateTimeOffset.Now}
                    ,
                    {"45B80679-2AF9-4516-B75D-70FF4D965E3C" ,"Kikuyu, Gikuyu" ,"KI", DateTimeOffset.Now}
                    ,
                    {"1384DB07-CD62-48A1-AF4B-F7E6EE449D94" ,"Kinyarwanda" ,"RW", DateTimeOffset.Now}
                    ,
                    {"3F864F2A-0DB7-4066-8ADB-6F9A52F28B06" ,"Kirghiz, Kyrgyz" ,"KY", DateTimeOffset.Now}
                    ,
                    {"94664A8B-1EA1-4652-9CDF-314BC12EBF55" ,"Komi" ,"KV", DateTimeOffset.Now}
                    ,
                    {"FD7189EF-4212-4573-8D4E-BF52BE4ADD89" ,"Kongo" ,"KG", DateTimeOffset.Now}
                    ,
                    {"4A070AB7-B71F-46CD-99FD-D9D963B9344C" ,"Korean" ,"KO", DateTimeOffset.Now}
                    ,
                    {"ED8B281B-CF70-4964-A8AA-8C39316169C9" ,"Kuanyama, Kwanyama" ,"KJ", DateTimeOffset.Now}
                    ,
                    {"CA745109-36E2-4B67-B70E-91B1CF5B86D4" ,"Kurdish" ,"KU", DateTimeOffset.Now}
                    ,
                    {"2D035865-5801-4386-BE03-44E4FB0ED8FA" ,"Lao" ,"LO", DateTimeOffset.Now}
                    ,
                    {"D40684CC-B988-4CA5-A599-8B35AA9088BF" ,"Latin" ,"LA", DateTimeOffset.Now}
                    ,
                    {"50C3F8B0-2FD6-4213-89A5-7E9ADD8FA2CC" ,"Latvian" ,"LV", DateTimeOffset.Now}
                    ,
                    {"13D9D9F2-81F2-480E-B96B-FC09C76F8FB1" ,"Limburgan, Limburger, Limburgish" ,"LI", DateTimeOffset.Now}
                    ,
                    {"9FD4451A-3550-473C-920D-A0CF340D2804" ,"Lingala" ,"LN", DateTimeOffset.Now}
                    ,
                    {"681D76FB-EC6D-4EC0-9782-50D0E4CC66A8" ,"Lithuanian" ,"LT", DateTimeOffset.Now}
                    ,
                    {"4F7EA487-BE51-404E-A72B-8BBA24BEFA9C" ,"Luba-Katanga" ,"LU", DateTimeOffset.Now}
                    ,
                    {"CC5B51EE-AA2A-4CEE-92B0-A4450B723543" ,"Luxembourgish, Letzeburgesch" ,"LB", DateTimeOffset.Now}
                    ,
                    {"CE2C8FE3-48BA-4524-B135-F45DA8A82D3B" ,"Macedonian" ,"MK", DateTimeOffset.Now}
                    ,
                    {"3B16F70F-6928-4189-8BD4-FCE81B1E47DE" ,"Malagasy" ,"MG", DateTimeOffset.Now}
                    ,
                    {"F0B9D162-C8E4-4A3C-BDBE-6ED306CBCABD" ,"Malay" ,"MS", DateTimeOffset.Now}
                    ,
                    {"08EE45DD-7931-474F-AD5B-2192A37BB608" ,"Malayalam" ,"ML", DateTimeOffset.Now}
                    ,
                    {"D1DA3716-8B0C-4F1E-948E-83E4451C41E5" ,"Maltese" ,"MT", DateTimeOffset.Now}
                    ,
                    {"6D55FF64-D804-455A-9A53-D6B02441812F" ,"Manx" ,"GV", DateTimeOffset.Now}
                    ,
                    {"AFAD8093-C278-46EA-8FA8-E15EB993D18E" ,"Maori" ,"MI", DateTimeOffset.Now}
                    ,
                    {"2AC23FCA-26F2-48DE-946D-989F1FEE5590" ,"Marathi" ,"MR", DateTimeOffset.Now}
                    ,
                    {"63C0159A-2550-4559-89F4-A1448231D3F2" ,"Marshallese" ,"MH", DateTimeOffset.Now}
                    ,
                    {"A76507AA-4A5A-4C7F-ABDA-A04E9B6F4ED6" ,"Mongolian" ,"MN", DateTimeOffset.Now}
                    ,
                    {"30FE040D-737F-4633-B599-B99A5DB125F9" ,"Nauru" ,"NA", DateTimeOffset.Now}
                    ,
                    {"A7DFCE9A-68D7-47B8-9D58-B07EC1427070" ,"Navajo, Navaho" ,"NV", DateTimeOffset.Now}
                    ,
                    {"63D5FEC3-B194-458B-A752-F526C45B0B55" ,"North Ndebele" ,"ND", DateTimeOffset.Now}
                    ,
                    {"7070E054-2865-4BE8-9862-58DFE1F66FE0" ,"South Ndebele" ,"NR", DateTimeOffset.Now}
                    ,
                    {"C03CB67F-B388-45F4-9928-15252A6C0C44" ,"Ndonga" ,"NG", DateTimeOffset.Now}
                    ,
                    {"2638596D-9A9A-488E-AD26-D8E5095DF1C6" ,"Nepali" ,"NE", DateTimeOffset.Now}
                    ,
                    {"62DBE07F-4FC0-4260-926F-EEFCBF15918E" ,"Norwegian" ,"NO", DateTimeOffset.Now}
                    ,
                    {"CC735EEC-FDF2-46B5-B3E9-B1944065F444" ,"Norwegian Bokmål" ,"NB", DateTimeOffset.Now}
                    ,
                    {"B1F40B6B-8946-4210-9614-6331DFA0576E" ,"Norwegian Nynorsk" ,"NN", DateTimeOffset.Now}
                    ,
                    {"1B159CD8-3C47-481B-86B9-C0A84478A8AD" ,"Sichuan Yi, Nuosu" ,"II", DateTimeOffset.Now}
                    ,
                    {"9C05B82D-44EA-4912-8A47-B864B2F93644" ,"Occitan" ,"OC", DateTimeOffset.Now}
                    ,
                    {"36BA9D0D-C263-4910-9024-9B07CE95CBE4" ,"Ojibwa" ,"OJ", DateTimeOffset.Now}
                    ,
                    {"5B8A51D6-BDEE-42DF-B7C8-98490107AF47" ,"Oriya" ,"OR", DateTimeOffset.Now}
                    ,
                    {"5D1CD6A3-6015-4B6D-96CF-B8EC19E45369" ,"Oromo" ,"OM", DateTimeOffset.Now}
                    ,
                    {"4B3990B8-EAF1-4485-9AF2-39BCE6AB3FBA" ,"Ossetian, Ossetic" ,"OS", DateTimeOffset.Now}
                    ,
                    {"A120ED0B-55CF-421D-8E42-8447C2BBA28B" ,"Pali" ,"PI", DateTimeOffset.Now}
                    ,
                    {"6486B3DB-98B3-4374-9010-23E397ADB86F" ,"Pashto, Pushto" ,"PS", DateTimeOffset.Now}
                    ,
                    {"3D8B7720-C8CC-4A94-90C1-33D965F23190" ,"Persian" ,"FA", DateTimeOffset.Now}
                    ,
                    {"1F8B8C62-A3FB-4C6B-B743-52F3904FF51C" ,"Polish" ,"PL", DateTimeOffset.Now}
                    ,
                    {"4B01185B-DB05-4BA7-A185-AA84AA534751" ,"Portuguese" ,"PT", DateTimeOffset.Now}
                    ,
                    {"BB0EFF48-8896-4A5B-9548-6287557408A5" ,"Punjabi, Panjabi" ,"PA", DateTimeOffset.Now}
                    ,
                    {"6320D8E4-2D9E-4F1B-9830-B59C49FE4B77" ,"Quechua" ,"QU", DateTimeOffset.Now}
                    ,
                    {"F10FD62A-544A-44D1-9A2D-B2E0F1E0DB65" ,"Romanian, Moldavian, Moldovan" ,"RO", DateTimeOffset.Now}
                    ,
                    {"C586BC7E-079D-4DF8-8AD4-295DC55F2596" ,"Romansh" ,"RM", DateTimeOffset.Now}
                    ,
                    {"6D9967A6-8252-4623-B4BF-9E38A70AC409" ,"Rundi" ,"RN", DateTimeOffset.Now}
                    ,
                    {"F03FDD6C-1C1E-4056-A653-8801C165B390" ,"Russian" ,"RU", DateTimeOffset.Now}
                    ,
                    {"63DD6543-C251-49E6-9908-CC5A0E5E1293" ,"Northern Sami" ,"SE", DateTimeOffset.Now}
                    ,
                    {"27EBD049-434F-481A-B95B-41C1F2A6F430" ,"Samoan" ,"SM", DateTimeOffset.Now}
                    ,
                    {"C05D7B71-6EA2-46F7-8A01-AF9EA8670EE8" ,"Sango" ,"SG", DateTimeOffset.Now}
                    ,
                    {"CE03B8D7-6CB7-4589-9070-7A17E902B678" ,"Sanskrit" ,"SA", DateTimeOffset.Now}
                    ,
                    {"AD630947-A87B-4446-B9BE-A3F3D5A2A51E" ,"Sardinian" ,"SC", DateTimeOffset.Now}
                    ,
                    {"37BEAE37-290A-4AA6-AF27-85B548EF4FBD" ,"Serbian" ,"SR", DateTimeOffset.Now}
                    ,
                    {"FA9824DA-BD28-450A-9163-05B1891B3EA0" ,"Shona" ,"SN", DateTimeOffset.Now}
                    ,
                    {"1E4B3E84-7FB4-426B-AED7-D6737C6E60EF" ,"Sindhi" ,"SD", DateTimeOffset.Now}
                    ,
                    {"80419202-2B93-48A1-A9CF-08083DA676A0" ,"Sinhala, Sinhalese" ,"SI", DateTimeOffset.Now}
                    ,
                    {"AD810C94-A734-445C-A4C3-69A27A7FB321" ,"Slovak" ,"SK", DateTimeOffset.Now}
                    ,
                    {"5AC6F022-06C5-454F-B464-20353C963C14" ,"Slovenian" ,"SL", DateTimeOffset.Now}
                    ,
                    {"170519E9-6908-4DB9-A5C9-4EB8D1A206EC" ,"Somali" ,"SO", DateTimeOffset.Now}
                    ,
                    {"EEB1EB32-D222-4D43-8EEF-FDDE184F1428" ,"Southern Sotho" ,"ST", DateTimeOffset.Now}
                    ,
                    {"4A45C012-C7BB-46C1-B1BD-BBAC02C00D05" ,"Spanish, Castilian" ,"ES", DateTimeOffset.Now}
                    ,
                    {"74DF3B3E-EB14-41CB-B990-8C3D5BAF6E3A" ,"Sundanese" ,"SU", DateTimeOffset.Now}
                    ,
                    {"2A747C34-D2B5-4F0C-A110-B308DE8A2B2C" ,"Swahili" ,"SW", DateTimeOffset.Now}
                    ,
                    {"6655B866-460B-4355-86A8-E6FDB37AE9D6" ,"Swati" ,"SS", DateTimeOffset.Now}
                    ,
                    {"2F09D11B-C9E4-42BB-9F69-AA994AFDCC35" ,"Swedish" ,"SV", DateTimeOffset.Now}
                    ,
                    {"02E3AE78-0BAB-41AC-9EBE-EC2D22DC7E49" ,"Tagalog" ,"TL", DateTimeOffset.Now}
                    ,
                    {"7DA2D602-6FF0-4F67-9A07-A2A2C89C2B7F" ,"Tahitian" ,"TY", DateTimeOffset.Now}
                    ,
                    {"5D0408E6-4FE4-471D-8AAD-398446E7EFBB" ,"Tajik" ,"TG", DateTimeOffset.Now}
                    ,
                    {"96E786C2-7715-489E-947E-CAA84E0DC2E7" ,"Tamil" ,"TA", DateTimeOffset.Now}
                    ,
                    {"68F449CE-76DD-4FD2-AF49-7CB352C2E295" ,"Tatar" ,"TT", DateTimeOffset.Now}
                    ,
                    {"482BD204-A423-4049-88E5-13469E34057E" ,"Telugu" ,"TE", DateTimeOffset.Now}
                    ,
                    {"414574C0-4129-4155-BA34-1F6D9B30241D" ,"Thai" ,"TH", DateTimeOffset.Now}
                    ,
                    {"6BC5F049-9936-4A56-807A-3375662E5C2A" ,"Tibetan" ,"BO", DateTimeOffset.Now}
                    ,
                    {"B7B45200-4373-46DF-955F-8DD847D137BF" ,"Tigrinya" ,"TI", DateTimeOffset.Now}
                    ,
                    {"E49EC18E-FEFA-469E-A07E-A3CAA786B4FB" ,"Tonga (Tonga Islands)" ,"TO", DateTimeOffset.Now}
                    ,
                    {"335CF910-E9F2-4764-A97A-417FF2D16B82" ,"Tsonga" ,"TS", DateTimeOffset.Now}
                    ,
                    {"53B9B819-C4E9-4477-AFD3-0B4AEF645629" ,"Tswana" ,"TN", DateTimeOffset.Now}
                    ,
                    {"7D2B3978-EC73-4A78-BF4E-8F600EB0755A" ,"Turkish" ,"TR", DateTimeOffset.Now}
                    ,
                    {"C4E5BA5E-1947-401D-AC13-E695D9C1C019" ,"Turkmen" ,"TK", DateTimeOffset.Now}
                    ,
                    {"E69F1C42-8F74-4804-888B-A08016528173" ,"Twi" ,"TW", DateTimeOffset.Now}
                    ,
                    {"DA1F2F1B-C607-4E3F-A900-93CDF94789AB" ,"Uighur, Uyghur" ,"UG", DateTimeOffset.Now}
                    ,
                    {"CB4535E8-7103-4D76-8D18-7B674C26F324" ,"Ukrainian" ,"UK", DateTimeOffset.Now}
                    ,
                    {"7F4FF1A0-EF42-4CE2-B948-481C53961E75" ,"Urdu" ,"UR", DateTimeOffset.Now}
                    ,
                    {"981282E8-3CCE-46B0-8928-C1E62FF464CB" ,"Uzbek" ,"UZ", DateTimeOffset.Now}
                    ,
                    {"5DA62308-6B62-4B11-94FA-A3D01112974E" ,"Venda" ,"VE", DateTimeOffset.Now}
                    ,
                    {"D2B52674-EB69-4245-81A4-63FAD9DB0C0B" ,"Vietnamese" ,"VI", DateTimeOffset.Now}
                    ,
                    {"3876753C-6CC9-4EAA-8E7E-A33BEE6AD315" ,"Volapük" ,"VO", DateTimeOffset.Now}
                    ,
                    {"2C11A442-3753-4D43-9AA6-261E897F79AA" ,"Walloon" ,"WA", DateTimeOffset.Now}
                    ,
                    {"B0305613-0743-40A2-A2DC-28BF5F264D2D" ,"Welsh" ,"CY", DateTimeOffset.Now}
                    ,
                    {"449387E5-01E4-4548-BB35-4CE5CD231D1B" ,"Wolof" ,"WO", DateTimeOffset.Now}
                    ,
                    {"5CC757B7-6947-4F8F-88E2-80048115D564" ,"Xhosa" ,"XH", DateTimeOffset.Now}
                    ,
                    {"1D963444-3D74-4B31-9C31-6A59C3566C31" ,"Yiddish" ,"YI", DateTimeOffset.Now}
                    ,
                    {"D2A1046A-18D1-4AA6-AB71-176EB8617D22" ,"Yoruba" ,"YO", DateTimeOffset.Now}
                    ,
                    {"F904E820-FEF8-436F-9F59-E9C6E418ADE1" ,"Zhuang, Chuang" ,"ZA", DateTimeOffset.Now}
                    ,
                    {"C4C9EA0F-ED40-48C1-B984-9BACC743CE0D" ,"Zulu" ,"ZU", DateTimeOffset.Now}
            },
            schema: "Lookup");

            migrationBuilder.InsertData(
            table: "TimeInterval",
            columns: new[] { "Id", "Name", "DateCreated" },
            values: new object[,]
            {
                    {"82AE49D5-26E0-4B58-BE48-A8ECBC3E01BD","Hour",DateTimeOffset.Now}
                    ,
                    {"DAF8310E-B864-451E-8D48-E3F12D15D957","Day",DateTimeOffset.Now}
                    ,
                    {"D31608F3-971B-413A-BFC4-CA61C14C0D50","Week",DateTimeOffset.Now}
                    ,
                    {"0EFC48B5-E04E-4BA5-A2F1-305E965BC7CB","Month",DateTimeOffset.Now}
            },
            schema: "Lookup");
            #endregion Lookups

            #region Opportunity
            migrationBuilder.InsertData(
            table: "OpportunityCategory",
            columns: new[] { "Id", "Name", "ImageURL", "DateCreated" },
            values: new object[,]
            {
                    {"2CCBACF7-1ED9-4E20-BB7C-43EDFDB3F950","Agriculture","https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/Agriculture.svg",DateTimeOffset.Now}
                    ,
                    {"89F4AB46-0767-494F-A18C-3037F698133A","Career and Personal Development","https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/CareerAndPersonalDevelopment.svg",DateTimeOffset.Now}
                    ,
                    {"C76786FD-FCA9-4633-85B3-11E53486D708","Business and Entrepreneurship","https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/BusinessAndEntrepreneurship.svg", DateTimeOffset.Now}
                    ,
                    {"D0D322AB-D1D7-44B6-94E8-7B85246AA42E","Environment and Climate","https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/EnvironmentAndClimate.svg",DateTimeOffset.Now}
                    ,
                    {"FA564C1C-591A-4A6D-8294-20165DA8866B","Technology and Digitization","https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/TechnologyAndDigitization.svg",DateTimeOffset.Now}
                    ,
                    {"F36051C9-9057-4765-BC2F-9DEE82EF60D6","Tourism and Hospitality","https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/opportunity/category/TourismAndHospitality.svg",DateTimeOffset.Now}
            },
            schema: "Opportunity");

            migrationBuilder.InsertData(
            table: "OpportunityDifficulty",
            columns: new[] { "Id", "Name", "DateCreated" },
            values: new object[,]
            {
                    {"E33AE372-C63F-459D-983F-4527355FD0C4","Beginner",DateTimeOffset.Now}
                    ,
                    {"E84EFA58-F0FF-41F4-A2DB-12C33F5E306C","Intermediate",DateTimeOffset.Now}
                    ,
                    {"833E1F02-31B9-455E-8F4F-CE6A6C4A9AA7","Advanced",DateTimeOffset.Now}
                    ,
                    {"448E2CE3-DDF9-43EA-BE8D-B30CB8712222","Any Level",DateTimeOffset.Now}
            },
            schema: "Opportunity");

            migrationBuilder.InsertData(
            table: "OpportunityStatus",
            columns: new[] { "Id", "Name", "DateCreated" },
            values: new object[,]
            {
                    {"B99D26D7-A4B0-4A38-B35D-AE2D379A414E","Active",DateTimeOffset.Now}
                    ,
                    {"46FD954E-2F0E-4892-83EE-1B967E9B2803","Inactive",DateTimeOffset.Now}
                    ,
                    {"7FD45DD7-89BC-4307-B119-8B166E1B945F","Expired",DateTimeOffset.Now}
                    ,
                    {"691CA956-5C83-4EAC-B1EB-50161A603D95","Deleted",DateTimeOffset.Now}
            },
            schema: "Opportunity");

            migrationBuilder.InsertData(
            table: "OpportunityType",
            columns: new[] { "Id", "Name", "DateCreated" },
            values: new object[,]
            {
                    {"25F5A835-C3F7-43CA-9840-D372A1D26694","Learning",DateTimeOffset.Now}
                    ,
                    {"F12A9D90-A8F6-4914-8CA5-6ACF209F7312","Task",DateTimeOffset.Now}
            },
            schema: "Opportunity");

            migrationBuilder.InsertData(
            table: "OpportunityVerificationType",
            columns: new[] { "Id", "Name", "DisplayName", "Description", "DateCreated" },
            values: new object[,]
            {
                    {"AE4B5CA3-20CE-451A-944E-67EF24E455B6","FileUpload","File Upload","A file of your completion certificate in PDF format",DateTimeOffset.Now}
                    ,
                    {"5DDA13B1-FFE6-4C19-8137-235C7429D54C","Picture","Picture","A selfie of you showcasing what you did",DateTimeOffset.Now}
                    ,
                    {"29218322-68FC-4559-A807-61CC27F4E979","Location","Location","A pin of where you where when you did this",DateTimeOffset.Now}
                    ,
                    {"43FB21C9-0ED7-46D4-A7D2-5E301881649C","VoiceNote","Voice Note","Explain the difference this had on your life",DateTimeOffset.Now}
            },
            schema: "Opportunity");

            migrationBuilder.InsertData(
            table: "MyOpportunityAction",
            columns: new[] { "Id", "Name", "DateCreated" },
            values: new object[,]
            {
                    {"7C57B803-6EAD-445E-B27B-19A79B72D0F2","Viewed",DateTimeOffset.Now}
                    ,
                    {"B2CC677B-4704-4F90-A1F7-3CD92D2485E0","Saved",DateTimeOffset.Now}
                    ,
                    {"CB1B8F0F-7BB2-473E-8F20-CA54F0BB8D7E","Verification",DateTimeOffset.Now}
            },
            schema: "Opportunity");

            migrationBuilder.InsertData(
            table: "MyOpportunityVerificationStatus",
            columns: new[] { "Id", "Name", "DateCreated" },
            values: new object[,]
            {
                    {"B57ED2D6-04B6-4C2C-BED9-A1C0BD98F468","Pending",DateTimeOffset.Now}
                    ,
                    {"FB203E32-C1D9-4200-A085-E18DEDADEFB2","Rejected",DateTimeOffset.Now}
                    ,
                    {"4BECE37C-BD3D-40E2-A7C5-2FF2D4A3C802","Completed",DateTimeOffset.Now}
            },
            schema: "Opportunity");
            #endregion Opportunity

            #region SSI
            migrationBuilder.InsertData(
            table: "SchemaType",
            columns: new[] { "Id", "Name", "Description", "SupportMultiple", "DateCreated" },
            values: new object[,]
            {
                    {"7818B5C3-3D57-4264-B90B-DF53EAA9F749","Opportunity","Opportunity",true,DateTimeOffset.Now}
                    ,
                    {"EC978798-AAC0-4577-846E-1B5B2E6663CE","YoID","Yoma Member (YoID)",false,DateTimeOffset.Now}
            },
            schema: "SSI");

            migrationBuilder.InsertData(
            table: "SchemaEntity",
            columns: new[] { "Id", "TypeName", "DateCreated" },
            values: new object[,]
            {
                    {"AC5C06AC-6EAD-4B47-8E11-4B182DAAC8CC","Yoma.Core.Domain.Entity.Models.User",DateTimeOffset.Now}
                    ,
                    {"B8C64B98-61C2-43F8-A583-7A7927340333","Yoma.Core.Domain.Entity.Models.Organization",DateTimeOffset.Now}
                    ,
                    {"E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D","Yoma.Core.Domain.Opportunity.Models.Opportunity",DateTimeOffset.Now}
                    ,
                    {"CA11D9D0-39F6-46D8-A0D3-350EC41402F5","Yoma.Core.Domain.MyOpportunity.Models.MyOpportunity",DateTimeOffset.Now}
            },
            schema: "SSI");

            migrationBuilder.InsertData(
            table: "SchemaEntityType",
            columns: new[] { "Id", "SSISchemaEntityId", "SSISchemaTypeId", "DateCreated" },
            values: new object[,]
            {
                    {Guid.NewGuid(),"AC5C06AC-6EAD-4B47-8E11-4B182DAAC8CC","EC978798-AAC0-4577-846E-1B5B2E6663CE",DateTimeOffset.Now}
                    ,
                    {Guid.NewGuid(),"B8C64B98-61C2-43F8-A583-7A7927340333","EC978798-AAC0-4577-846E-1B5B2E6663CE",DateTimeOffset.Now}
                    ,
                    {Guid.NewGuid(),"E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D","7818B5C3-3D57-4264-B90B-DF53EAA9F749",DateTimeOffset.Now}
                    ,
                    {Guid.NewGuid(),"CA11D9D0-39F6-46D8-A0D3-350EC41402F5","7818B5C3-3D57-4264-B90B-DF53EAA9F749",DateTimeOffset.Now}
            },
            schema: "SSI");

            migrationBuilder.InsertData(
            table: "SchemaEntityProperty",
            columns: new[] { "Id", "SSISchemaEntityId", "Name", "NameDisplay", "Description", "Required", "SystemType", "Format", "DateCreated" },
            values: new object?[,]
            {
                    {"32447353-1698-467C-8B5D-AD85E89235B0","AC5C06AC-6EAD-4B47-8E11-4B182DAAC8CC","Email","Email","Email",true,null,null,DateTimeOffset.Now}
                    ,
                    {"D26B85E6-223E-48B6-A12F-6C2D0136DD2F","AC5C06AC-6EAD-4B47-8E11-4B182DAAC8CC","FirstName","First Name","First Name",true,null,null,DateTimeOffset.Now}
                    ,
                    {"F7D89C98-0447-42DF-8A2D-A369B9FBAEBA","AC5C06AC-6EAD-4B47-8E11-4B182DAAC8CC","Surname","Surname","Surname",true,null,null,DateTimeOffset.Now}
                    ,
                    {"26EA32E2-5913-44B7-835F-12F0882685C4","AC5C06AC-6EAD-4B47-8E11-4B182DAAC8CC","DisplayName","Display Name","Display Name",true,"Title",null,DateTimeOffset.Now}
                    ,
                    {"64D4CBEB-3692-4E39-AAA7-B704F46AFB6D","AC5C06AC-6EAD-4B47-8E11-4B182DAAC8CC","PhoneNumber","Phone Number","Phone Number",false,null,null,DateTimeOffset.Now}
                    ,
                    {"B14C9C34-4C89-4DAE-88AB-9D667BE2EF7F","AC5C06AC-6EAD-4B47-8E11-4B182DAAC8CC","Country","Country","Country",false,null,null,DateTimeOffset.Now}
                    ,
                    {"B88A8825-FC5A-4000-93FE-9406A7898C58","AC5C06AC-6EAD-4B47-8E11-4B182DAAC8CC","CountryOfResidence","Country of Residence","Country of Residence",false,null,null,DateTimeOffset.Now}
                    ,
                    {"C26D9276-5F94-4BB3-94BA-67C435025708","AC5C06AC-6EAD-4B47-8E11-4B182DAAC8CC","Gender","Gender","Gender",false,null,null,DateTimeOffset.Now}
                    ,
                    {"D56808D2-F3DB-4D82-AA5C-1FBA04C8E3BD","AC5C06AC-6EAD-4B47-8E11-4B182DAAC8CC","DateOfBirth","Date of Birth","Date of Birth",false,null,"yyyy-MM-dd",DateTimeOffset.Now}
                    ,
                    {"F815A540-8C83-41DE-B67C-F327A4B92AF0","B8C64B98-61C2-43F8-A583-7A7927340333","Name","Name","Yoma (Youth Agency Marketplace)",true,"Issuer",null,DateTimeOffset.Now}
                    ,
                    {"084B3027-AF8A-4329-8221-C6437CFBCD61","B8C64B98-61C2-43F8-A583-7A7927340333","LogoURL","Logo Url","Yoma (Youth Agency Marketplace) Logo Url",false,"IssuerLogoURL",null,DateTimeOffset.Now}
                    ,
                    {"7DA9B94B-5158-4A62-9993-A6FAD6E5EA23","E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D","Title","Title","Title",true,"Title",null,DateTimeOffset.Now}
                    ,
                    {"5FAD171F-3E8C-4DB5-86FA-C4029FE29F22","E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D","Summary","Summary","Summary",false,null,null,DateTimeOffset.Now}
                     ,
                    {"755B1F54-1365-4D2F-AF29-8AEC57CC7B4C","E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D","Type","Type", "i.e. Learning",true,null,null,DateTimeOffset.Now}
                    ,
                    {"E763C235-F1B8-4D12-B60F-117AF7948355","E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D","OrganizationName","Organization Name","Organization Name",true,"Issuer",null,DateTimeOffset.Now}
                    ,
                    {"79E64F8F-5B1E-4DE2-88D4-2148E30CC49C","E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D","OrganizationLogoURL","Organization Logo Url","Organization Logo Url",false,"IssuerLogoURL",null,DateTimeOffset.Now}
                    ,
                    {"FF423D0C-2E91-48A6-9245-28EEF6E96B01","E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D","Difficulty","Difficulty","i.e. Intermediate",true,null,null,DateTimeOffset.Now}
                    ,
                    {"F4BAA24B-463F-4B74-BA81-7CC5DCBE8DF5","E8AE5B9B-11AE-4ECB-8F6C-020A3D6A5C3D","Skills.Name","Skills","Skills",false,null,null,DateTimeOffset.Now}
                    ,
                    {"A3E3FF94-67E0-4A03-983F-8D3D5DF5B56A","CA11D9D0-39F6-46D8-A0D3-350EC41402F5","UserDisplayName","User Display Name","User Display Name",true,null,null,DateTimeOffset.Now}
                    ,
                    {"CB8DE9BF-4C7C-429E-9B99-D92C9C6D79A0","CA11D9D0-39F6-46D8-A0D3-350EC41402F5","UserDateOfBirth","User Date of Birth","User Date of Birth",false,null,"yyyy-MM-dd",DateTimeOffset.Now}
                    ,
                    {"8AD09B9C-61A1-4A68-B401-E926DD84E9DC","CA11D9D0-39F6-46D8-A0D3-350EC41402F5","DateCompleted","Completion Date","Completion Date",false,null,"yyyy-MM-dd",DateTimeOffset.Now}
                    ,
                    {"682974E4-7AAB-4060-8A27-426F91C02ADD","CA11D9D0-39F6-46D8-A0D3-350EC41402F5","ZltoReward","Zlto Reward","Zlto Reward",false,null,"Z0.00",DateTimeOffset.Now}
                    ,
                    {"35632B44-19A1-4763-A92B-22E72B1BA4A3","CA11D9D0-39F6-46D8-A0D3-350EC41402F5","YomaReward","Yoma Reward","Yoma Reward",false,null,"Y0.00",DateTimeOffset.Now}
            },
            schema: "SSI");

            migrationBuilder.InsertData(
            table: "CredentialIssuanceStatus",
            columns: new[] { "Id", "Name", "DateCreated" },
            values: new object[,]
            {
                    {"952603D2-0661-4A11-9D3D-AAD07338120B","Pending",DateTimeOffset.Now}
                    ,
                    {"8CFD3852-B8F5-44E3-ACCB-5FD8BD885AFB","Issued",DateTimeOffset.Now}
                    ,
                    {"067AFB08-407D-44EB-BE92-FB84443553FF","Error",DateTimeOffset.Now}
            },
            schema: "SSI");

            migrationBuilder.InsertData(
            table: "TenantCreationStatus",
            columns: new[] { "Id", "Name", "DateCreated" },
            values: new object[,]
            {
                    {"39562CB1-15F9-4B2A-9CE9-9CE875D7C253","Pending",DateTimeOffset.Now}
                    ,
                    {"32EC538F-7EFE-406B-AB8E-39918889276A","Created",DateTimeOffset.Now}
                    ,
                    {"B0F16D40-C3FE-4ACA-9EA7-5201158C083D","Error",DateTimeOffset.Now}
            },
            schema: "SSI");

            migrationBuilder.InsertData(
            table: "WalletCreationStatus",
            columns: new[] { "Id", "Name", "DateCreated" },
            values: new object[,]
            {
                    {"494B9DBC-3299-42D2-8F2D-8DEC6A583231","Pending",DateTimeOffset.Now}
                    ,
                    {"2F46C953-D5B2-4048-B40D-BA3B86A4D926","Created",DateTimeOffset.Now}
                    ,
                    {"1B4AEA96-EF82-471E-82E4-5F18FB2B8424","Error",DateTimeOffset.Now}
            },
            schema: "Reward");

            migrationBuilder.InsertData(
            table: "TransactionStatus",
            columns: new[] { "Id", "Name", "DateCreated" },
            values: new object[,]
            {
                    {"708C3350-F49C-4324-8F43-76E8E8761845","Pending",DateTimeOffset.Now}
                    ,
                    {"C522E881-935F-40FA-A2A9-157F613FF3EC","Processed",DateTimeOffset.Now}
                    ,
                    {"FB125D05-D6DF-4BFE-ABCA-385D23C851AA","ProcessedInitialBalance",DateTimeOffset.Now}
                    ,
                    {"19140FDC-648E-4523-9BC9-32D613476831","Error",DateTimeOffset.Now}
            },
            schema: "Reward");

            migrationBuilder.InsertData(
            table: "TransactionStatus",
            columns: new[] { "Id", "Name", "DateCreated" },
            values: new object[,]
            {
                    {"262E8AD0-868A-4969-A7B7-2A04FBCCD881","Reserved",DateTimeOffset.Now}
                    ,
                    {"C2C85FDD-4C34-4352-93C7-FB65DCA359A0","Released",DateTimeOffset.Now}
                    ,
                    {"33999712-8880-4E87-BF2F-0D94B959EF46","Sold",DateTimeOffset.Now}
            },
            schema: "Marketplace");
            #endregion SSI
        }
    }
}
