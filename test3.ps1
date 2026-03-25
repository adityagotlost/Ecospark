$content = Get-Content -Path ".env" -Raw
if ($content -match "VITE_GEMINI_API_KEY=(.*?)`r?`n") {
    $apiKey = $matches[1].Trim()
    $url = "https://generativelanguage.googleapis.com/v1beta/models?key=$apiKey"
    $response = Invoke-RestMethod -Uri $url -Method Get
    $response.models | Where-Object name -match 'gemini' | Select-Object name, version | Format-Table -AutoSize
}
