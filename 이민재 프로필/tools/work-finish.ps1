[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$repoRoot = (& git -C $projectRoot rev-parse --show-toplevel).Trim()

if ($LASTEXITCODE -ne 0) {
    throw 'Git 저장소 루트를 찾지 못했습니다.'
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
    $bundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    if (Test-Path -LiteralPath $bundledNode) {
        $nodePath = $bundledNode
    } else {
        throw 'Node.js를 찾지 못했습니다. Node.js LTS를 설치하거나 Codex 런타임을 확인하세요.'
    }
} else {
    $nodePath = $nodeCommand.Source
}

$tests = @(Get-ChildItem -LiteralPath (Join-Path $projectRoot 'profile-site\tests') -File | Where-Object { $_.Name -match '\.test\.(js|mjs)$' } | Select-Object -ExpandProperty FullName)
& $nodePath --test @tests
if ($LASTEXITCODE -ne 0) {
    throw 'Node 테스트가 실패했습니다.'
}

$syntaxFiles = @(
    'profile-site\script.js',
    'profile-site\data_v3.js',
    'profile-site\api\_core.js',
    'profile-site\api\_handler.js',
    'profile-site\api\admin.mjs'
)
foreach ($relativePath in $syntaxFiles) {
    & $nodePath --check (Join-Path $projectRoot $relativePath)
    if ($LASTEXITCODE -ne 0) {
        throw "구문 검사가 실패했습니다: $relativePath"
    }
}

& git -C $repoRoot diff --check -- ':(top)이민재 프로필'
if ($LASTEXITCODE -ne 0) {
    throw 'Git diff 공백 검사가 실패했습니다.'
}

Write-Host "`n[기기 전환 전 프로젝트 변경]"
& git -C $repoRoot status --short -uall -- ':(top)이민재 프로필'
Write-Host "`n검증 완료. HANDOFF.md를 갱신하고 정확한 파일만 검토한 뒤, 명시적으로 요청된 경우에만 작업 브랜치에 commit·push하세요."
