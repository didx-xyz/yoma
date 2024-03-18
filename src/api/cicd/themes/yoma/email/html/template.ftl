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
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          line-height: 0.6;
        }

        #username{
        color: #f9aa3f;
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
          border-radius: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100px;
          margin: 20px auto;
          width: 100px;
          font-size: 40px;
          box-shadow: 0px 10px 15px rgba(0, 0, 0, 0.1);
        }

        #zlto-icon {
          width: 50px;
          height: 50px;
          padding: 25px;
        }

        .icon-banner {
          display: grid;
          grid-template-columns: 1fr 3fr;
          align-items: center;
          margin: 10px auto;
        }

        .link-btn {
            background-color: #387F6B;
            border-radius: 25px;
            color: white;
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
        }

        .bottom-content-section h2 {
            text-align: center;
            margin-top: 50px;
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

        @media screen and (max-width: 1200px){
          .banner-container{
            width: 100%;
          }
        }
    </style>
</head>
<body>
    <div class="email-header">
      <img src="${url.resourcesPath}/img/yoma.png"  alt="Yoma" id="logo"/>
        <div>
          <h1>Hello,</h1>
          <h1 id="username">${(user.username)!}</h1>
        </div>
    </div>
    <div class="page-body">
      <div class="top-content-section">
      </div>
      <div class="nested-content">
          <#nested>
      </div>
          <div class="seperator"></div>
      <div class="bottom-content-section">
        <div class="banner-container">
          <h2>With Yoma, you can do the following:</h2>
          <div class="icon-banner">
              <span class="icon">🌟</span>
                <p>Redeem certificates of completion for challenges and be rewarded</p>
            </div>
                <div class="seperator"></div>
            <div class="icon-banner">
              <span class="icon">📄</span>
                <p>Build your Digital CV by adding completed opportunities</p>
            </div>
            <div class="seperator"></div>
            <div class="icon-banner">
              <img class="icon" id="zlto-icon" src="${url.resourcesPath}/img/icon-zlto.svg" alt="zlto-icon"/>
                <p>Earn ZLTO, the platform's digital token, by completing opportunities</p>
            </div>
            <div class="seperator"></div>
            <div class="icon-banner">
              <span class="icon">🛍️</span>
                <p>Spend ZLTO in the Yoma marketplace on selected product offerings such as airtime and data</p>
            </div>
          </div>
      </div>
      <div class="email-footer">
          <p>Build your future with Yoma. Opportunity awaits.</p>
      </div>
    </div>
</body>
</html>
</#macro>
