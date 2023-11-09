<#macro emailLayout>
<html>
<head>
    <style>
        .email-header {
            background-color: #461d4d;
            color: white;
            font-size: 16px;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
        }

        .top-content-section {
            color: #461d4d;
            text-align: center;
            margin-bottom: 10px;
        }

        .nested-content {
            text-align: center;
            margin-bottom: 10px;
        }

        .bottom-content-section h4 {
            margin-bottom: 30px;
            text-align: center;
        }

        .bottom-content-section div {
            margin-bottom: 20px;
        }

        .bottom-content-section p {
            color: #545859;
            text-align: center;
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

        .seperator {
            border: solid 1px #E5E5E5;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="email-header">
        <h1>Welcome to Yoma</h1>
    </div>
    <div class="top-content-section">
        <p>Thank you for joining the Yoma family!</p>
    </div>
    <div class="nested-content">
        <#nested>
    </div>
        <div class="seperator"></div>
    <div class="bottom-content-section">
        <h4>With Yoma, you can do the following:</h4>
        <div>
            <p>Redeem certificates of completion for challenges and be rewarded</p>
        </div>
            <div class="seperator"></div>
        <div>
            <p>Build your Digital CV by adding completed opportunities</p>
        </div>
            <div class="seperator"></div>
        <div>
            <p>Earn ZLTO, the platform's digital token, by completing opportunities</p>
        </div>
        <div>
            <p>Spend ZLTO in the Yoma marketplace on selected product offerings such as airtime and data</p>
        </div>
    </div>
    <div class="email-footer">
        <p>Build your future with Yoma. Opportunity awaits.</p>
    </div>
</body>
</html>
</#macro>
