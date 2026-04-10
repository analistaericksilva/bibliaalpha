$count=10
Get-ChildItem -Filter '20250109_0*_lote*.sql' | Sort-Object Name | ForEach-Object { 
    $newName='20260415_{0:d3}_lote{1}.sql' -f $count, ($_.Name -replace '.*lote(\d+).*','$1')
    Rename-Item $_.FullName $newName
    $count++
    Write-Host "Renomeado: $($_.Name) -> $newName"
}
