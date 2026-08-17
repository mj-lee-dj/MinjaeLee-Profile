[CmdletBinding()]
param(
    [switch]$SkipFetch
)

$ErrorActionPreference = 'Stop'

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
    & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git 명령이 실패했습니다: git $($Arguments -join ' ')"
    }
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$repoRoot = (Invoke-Git '-C' $projectRoot rev-parse --show-toplevel | Select-Object -Last 1).Trim()
$expectedProject = [IO.Path]::GetFullPath((Join-Path $repoRoot '이민재 프로필'))

if ([IO.Path]::GetFullPath($projectRoot) -ne $expectedProject) {
    throw "예상 프로젝트 경로가 아닙니다. 예상: $expectedProject / 실제: $projectRoot"
}

Invoke-Git '-C' $repoRoot config --local pull.ff only
Invoke-Git '-C' $repoRoot config --local fetch.prune true
Invoke-Git '-C' $repoRoot config --local push.default simple
Invoke-Git '-C' $repoRoot config --local core.longpaths true

if (-not $SkipFetch) {
    Invoke-Git '-C' $repoRoot fetch --prune origin
}

$gitName = (@(& git -C $repoRoot config user.name) -join '').Trim()
$gitEmail = (@(& git -C $repoRoot config user.email) -join '').Trim()
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue

Write-Host "Git 루트: $repoRoot"
Write-Host "프로젝트: $projectRoot"
Write-Host '설정: pull.ff=only, fetch.prune=true, push.default=simple, core.longpaths=true'

if (-not $gitName -or -not $gitEmail) {
    Write-Warning 'Git user.name 또는 user.email이 없습니다. 각 기기에서 본인 값으로 설정하세요.'
} else {
    Write-Host "Git 사용자: $gitName <$gitEmail>"
}

if ($nodeCommand) {
    Write-Host "Node.js: $(& node --version) ($($nodeCommand.Source))"
} else {
    Write-Warning 'Node.js가 PATH에 없습니다. Codex 번들 런타임 또는 Node.js LTS가 있어야 테스트를 실행할 수 있습니다.'
}

if ($repoRoot -match '(?i)(Google Drive|내 드라이브|OneDrive|Dropbox)') {
    Write-Warning '현재 저장소가 클라우드 동기화 폴더 안에 있습니다. 다른 기기에는 클라우드 밖의 별도 clone을 권장합니다.'
}

Write-Host '기기 설정 점검 완료. 작업 시작 시 .\tools\work-start.cmd를 실행하세요.'
