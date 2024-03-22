<#macro emailLayout>
<html>
<head>
  <style>
    p {
      color: #545859;
      font-size: 16px;
    }

    .email-header {
      background-color: #461d4d;
      color: white;
      font-size: 16px;
      padding: 20px;
      text-align: right;
      margin-bottom: 50px;
      line-height: 0.6;
    }

    #username {
      color: #f9aa3f;
      line-height: 1.2;
    }

    #logo {
      width: 115px;
      height: 50px;
      margin-top: 15px;
    }

    .top-content-section {
      text-align: center;
      margin-top: 50px;
      margin-bottom: 25px;
    }

    .top-content-section h2 {
      margin-bottom: -10px;
    }

    .banner-container {
      margin: 20px auto;
      margin-bottom: 50px;
      width: 60%;
    }

    .icon {
      background-color: white;
      border-radius: 50px;
      font-size: 40px;
      box-shadow: 0px 10px 15px rgba(0, 0, 0, 0.1);
      padding: 22px 25px;
      line-height: 0.6;
    }

    #zlto-icon {
      width: 40px;
      height: 40px;
      padding: 25px;
      font-size: 12px;
      box-shadow: 0px 10px 15px rgba(0, 0, 0, 0.1);
      border-radius: 50px;
    }

    .icon-banner {
      margin: 10px auto;
    }

    .link-btn {
      background-color: #387F6B;
      border-radius: 25px;
      color: white !important;
      display: inline-block;
      font-size: 16px;
      margin: 20px auto;
      margin-bottom: 50px;
      padding: 15px 85px;
      cursor: pointer;
      text-decoration: none;
    }

    .link-btn:hover {
      color: white;
    }

    .nested-content {
      text-align: center;
      margin-bottom: 10px;
      margin-top: 50px !import;
    }

    .nested-content a {
      background-color: #387F6B;
      border-radius: 25px;
      color: white !important;
      display: inline-block;
      font-size: 16px;
      margin: 20px auto;
      margin-bottom: 50px;
      padding: 15px 85px;
      cursor: pointer;
      text-decoration: none;
    }

    .bottom-content-section h2 {
      text-align: center;
      margin-top: 50px;
      color: black;
    }

    .bottom-content-section p {
      color: #545859;
    }

    .email-footer {
      background-color: #F9AB3F;
      padding: 20px;
    }

    .email-footer p {
      font-size: 14px;
      text-align: center;
      color: white;
    }

    .page-body {
      margin: 0 50px;
    }

    .seperator {
      border: solid 1px #E5E5E5;
    }

    tr {
      margin: 0 auto;
    }

    .header-msg {
      color: white;
    }

    @media screen and (max-width: 1000px) {
      .banner-container {
        width: 100%;
      }
    }
  </style>
</head>

<body>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="right" class="email-header">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="left"> <img src="https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/shared-resources/yoma.png" alt="Yoma" id="logo" /> </td>
            <td align="right">
              <h1 class="header-msg">Hello,</h1>
              <h1 id="username">${(user.firstName)!} ${(user.lastName)!}</h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td class="page-body">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td class="top-content-section"> </td>
          </tr>
          <tr>
            <td class="nested-content">
              <#nested>
            </td>
          </tr>
          <tr>
            <td class="seperator"></td>
          </tr>
          <tr>
            <td class="bottom-content-section">
              <table class="banner-container" width="60%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h2>With Yoma, you can do the following:</h2>
                    <table class="row-wrapper" width="100%" cellpadding="0" cellspacing="40">
                      <tr>
                        <td width="10%" valign="middle" align="center"> <span class="icon">🌟</span> </td>
                        <td width="90%" valign="middle" align="left">
                          <p>Redeem certificates of completion for challenges and be rewarded</p>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" class="seperator"></td>
                      </tr>
                      <tr>
                        <td width="10%" valign="middle" align="center"> <span class="icon">📄</span> </td>
                        <td width="90%" valign="middle" align="left">
                          <p>Build your Digital CV by adding completed opportunities</p>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" class="seperator"></td>
                      </tr>
                      <tr>
                        <td width="10%" valign="middle" align="center"> <img id="zlto-icon"
                            src="https://yoma-v3-public-storage.s3.eu-west-1.amazonaws.com/shared-resources/icon-zlto.png" alt="zlto-icon" /> </td>
                        <td width="90%" valign="middle" align="left">
                          <p>Earn ZLTO, the platform's digital token, by completing opportunities</p>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" class="seperator"></td>
                      </tr>
                      <tr>
                        <td width="10%" valign="middle" align="center"> <span class="icon">🛍️</span> </td>
                        <td width="90%" valign="middle" align="left">
                          <p>Spend ZLTO in the Yoma marketplace on selected product offerings such as airtime and data
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td class="email-footer">
        <p>Build your future with Yoma. Opportunity awaits.</p>
      </td>
    </tr>
  </table>
</body>
</html>
</#macro>
