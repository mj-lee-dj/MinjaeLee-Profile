[CmdletBinding()]
param(
    [switch]$SkipFetch
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$repoRoot = (& git -C $projectRoot rev-parse --show-toplevel).Trim()

if ($LASTEXITCODE -ne 0) {
    throw 'Git 저장소 루트를 찾지 못했습니다.'
}

if (-not $SkipFetch) {
    & git -C $repoRoot fetch --prune origin
    if ($LASTEXITCODE -ne 0) {
        throw '원격 fetch에 실패했습니다. 네트워크와 GitHub 인증을 확인하세요.'
    }
}

$branch = (& git -C $repoRoot branch --show-current).Trim()
$head = (& git -C $repoRoot rev-parse --short HEAD).Trim()
$counts = ((& git -C $repoRoot rev-list --left-right --count 'HEAD...origin/main') -join ' ').Trim() -split '\s+'
$ahead = [int]$counts[0]
$behind = [int]$counts[1]
$projectStatus = @(& git -C $repoRoot status --short -uall -- ':(top)이민재 프로필')
$trackedRepoStatus = @(& git -C $repoRoot status --short --untracked-files=no)

Write-Host "Git 루트: $repoRoot"
Write-Host "프로젝트: $projectRoot"
Write-Host "브랜치/HEAD: $branch / $head"
Write-Host "origin/main 대비: ahead $ahead, behind $behind"

Write-Host "`n[이 프로젝트 변경]"
if ($projectStatus.Count -eq 0) {
    Write-Host '없음'
} else {
    $projectStatus | ForEach-Object { Write-Host $_ }
}

Write-Host "`n[저장소 전체 추적 변경]"
if ($trackedRepoStatus.Count -eq 0) {
    Write-Host '없음'
} else {
    $trackedRepoStatus | ForEach-Object { Write-Host $_ }
}

if ($behind -gt 0) {
    Write-Warning '원격 main보다 뒤처져 있습니다. 변경이 하나라도 있으면 pull하지 말고 먼저 내용을 확인하세요.'
}
if ($ahead -gt 0) {
    Write-Warning 'origin/main에 없는 로컬 커밋이 있습니다. push 대상 브랜치와 Production 배포 여부를 확인하세요.'
}
if ($branch -eq 'main') {
    Write-Warning '현재 main입니다. 진행 중 작업은 codex/<작업명> 브랜치를 권장합니다.'
}

Write-Host "`n먼저 읽을 문서: HANDOFF.md, .agents\AGENTS.md, MULTI_DEVICE_WORKFLOW.md"
