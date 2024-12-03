$files = @(
    "D:\Work\DIDx\yoma\src\keycloak\providers\keycloak-phone-provider.resources\src\main\resources\theme\phone\login\messages\messages_en.properties",
    "D:\Work\DIDx\yoma\src\keycloak\providers\keycloak-phone-provider.resources\src\main\resources\theme\phone\login\messages\messages_es.properties",
    "D:\Work\DIDx\yoma\src\keycloak\providers\keycloak-phone-provider.resources\src\main\resources\theme\phone\login\messages\messages_fr.properties",
    "D:\Work\DIDx\yoma\src\keycloak\providers\keycloak-phone-provider.resources\src\main\resources\theme\phone\login\messages\messages_pt.properties",
    "D:\Work\DIDx\yoma\src\keycloak\providers\keycloak-phone-provider.resources\src\main\resources\theme\phone\login\messages\messages_sw.properties"
)

foreach ($file in $files) {
    try {
        if (Test-Path $file) {
            # Read content with UTF-8 encoding
            $content = Get-Content -Path $file -Raw
            
            # Write back without BOM using UTF-8 encoding
            $utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($file, $content, $utf8NoBomEncoding)
            
            Write-Host "Successfully processed: $file" -ForegroundColor Green
        } else {
            Write-Host "File not found: $file" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Error processing $file : $_" -ForegroundColor Red
    }
}