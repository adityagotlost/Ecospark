$content = Get-Content -Path ".env" -Raw
if ($content -match "VITE_GEMINI_API_KEY=(.*?)`r?`n") {
    $apiKey = $matches[1].Trim().Replace('"', '').Replace("'", "")
}

$models = @("gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash-lite")

foreach ($m in $models) {
    try {
        $body = '{"contents":[{"parts":[{"text":"Hi"}]}]}'
        $url = "https://generativelanguage.googleapis.com/v1beta/models/$m`:generateContent?key=$apiKey"
        $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
        Write-Host "✅ WORKED: $m"
    } catch {
        Write-Host "❌ FAILED: $m - $($_.Exception.Message)"
    }
}
