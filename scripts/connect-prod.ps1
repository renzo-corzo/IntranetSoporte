param(
  [string]$Host = "192.168.123.147",
  [string]$User = "intranet",
  [int]$Port = 22,
  [string]$KeyPath = "",
  [string]$RemoteDir = "/var/www/intranet",
  [string]$Cmd = ""
)

$sshOpts = @("-p", $Port, "-o", "StrictHostKeyChecking=accept-new")
if ($KeyPath -and (Test-Path $KeyPath)) { $sshOpts += @("-i", $KeyPath) }

if ($Cmd -and $Cmd.Trim().Length -gt 0) {
  $remote = "cd '" + $RemoteDir + "' && bash -lc '" + $Cmd + "'"
  & ssh @sshOpts ("{0}@{1}" -f $User, $Host) $remote
} else {
  & ssh @sshOpts -t ("{0}@{1}" -f $User, $Host) ("cd '{0}' && exec bash -l" -f $RemoteDir)
}



