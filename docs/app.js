const repo = "ToyZ-95/Orbit"

let latestUrls = { arm64: null, armv7: null, x86: null }

function getAbiUrl(urls) {
    if (!urls) return null
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes("arm64") || ua.includes("aarch64")) return urls.arm64 || urls.armv7
    if (ua.includes("arm")) return urls.armv7 || urls.arm64
    return urls.arm64 || urls.armv7
}

function parseReleaseAssets(assets) {
    const out = { arm64: null, armv7: null, x86: null }
    if (!assets || !assets.length) return out
    assets.forEach(asset => {
        if (asset.name.includes("arm64")) out.arm64 = asset.browser_download_url
        if (asset.name.includes("armeabi")) out.armv7 = asset.browser_download_url
        if (asset.name.includes("x86")) out.x86 = asset.browser_download_url
    })
    return out
}

function formatSize(bytes) {
    if (!bytes) return ""
    return (bytes / 1024 / 1024).toFixed(1) + " MB"
}

function formatDate(dateStr) {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

// Fetch all releases: first = latest, rest = previous versions
fetch(`https://api.github.com/repos/${repo}/releases`)
    .then(res => res.json())
    .then(releases => {
        if (!Array.isArray(releases) || releases.length === 0) return

        const latest = releases[0]
        const assets = latest.assets || []
        let totalDownloads = 0

        assets.forEach(asset => {
            if (asset.name.includes("arm64")) latestUrls.arm64 = asset.browser_download_url
            if (asset.name.includes("armeabi")) latestUrls.armv7 = asset.browser_download_url
            if (asset.name.includes("x86")) latestUrls.x86 = asset.browser_download_url
            totalDownloads += asset.download_count || 0
        })

        const version = (latest.tag_name || latest.name || "").replace(/^v/, "")
        const apkMetaEl = document.getElementById("apkSize")
        if (apkMetaEl) {
            const parts = []
            if (version) parts.push("Version " + version)
            const firstApk = assets.find(a => a.name.endsWith(".apk")) || assets[0]
            if (firstApk) parts.push(formatSize(firstApk.size))
            apkMetaEl.textContent = parts.join(" · ")
        }

        const downloadsEl = document.getElementById("downloads")
        if (downloadsEl && totalDownloads > 0) {
            const formatted = totalDownloads >= 1000
                ? (totalDownloads / 1000).toFixed(1).replace(/\.0$/, "") + "K+"
                : totalDownloads + "+"
            downloadsEl.textContent = formatted
        }

        // Previous versions (skip first release)
        const previous = releases.slice(1)
        const loadingEl = document.getElementById("previousVersionsLoading")
        const listEl = document.getElementById("previousVersionsListInner")

        if (loadingEl) loadingEl.hidden = true

        if (previous.length === 0) {
            const empty = document.createElement("p")
            empty.className = "previous-versions-empty"
            empty.textContent = "No previous versions yet."
            document.getElementById("previousVersionsScroll").appendChild(empty)
        } else {
            listEl.hidden = false
            previous.forEach(release => {
                const urls = parseReleaseAssets(release.assets)
                const firstApk = (release.assets || []).find(a => a.name.endsWith(".apk")) || (release.assets || [])[0]
                const ver = (release.tag_name || release.name || "Unknown").replace(/^v/, "")
                const size = formatSize(firstApk && firstApk.size)
                const date = formatDate(release.published_at)

                const li = document.createElement("li")
                li.innerHTML = `
                    <div class="previous-version-info">
                        <strong>v${ver}</strong>
                        <span>${[date, size].filter(Boolean).join(" · ")}</span>
                    </div>
                    <button type="button" class="previous-version-download" data-arm64="${urls.arm64 || ""}" data-armv7="${urls.armv7 || ""}" data-x86="${urls.x86 || ""}">Download</button>
                `
                const btn = li.querySelector(".previous-version-download")
                btn.addEventListener("click", () => {
                    const u = getAbiUrl({ arm64: urls.arm64, armv7: urls.armv7, x86: urls.x86 })
                    if (u) window.location.href = u
                })
                listEl.appendChild(li)
            })
        }
    })
    .catch(() => {
        const loadingEl = document.getElementById("previousVersionsLoading")
        if (loadingEl) {
            loadingEl.textContent = "Could not load versions."
        }
    })

// Collapsible toggle
const toggle = document.getElementById("previousVersionsToggle")
const panel = document.getElementById("previousVersionsList")
if (toggle && panel) {
    toggle.addEventListener("click", () => {
        const open = toggle.getAttribute("aria-expanded") === "true"
        toggle.setAttribute("aria-expanded", !open)
        panel.classList.toggle("is-open", !open)
    })
}

// Latest version download
function detectABI() {
    return getAbiUrl(latestUrls)
}

document.getElementById("installBtn").onclick = () => {
    const url = detectABI()
    if (!url) return
    const bar = document.getElementById("progressBar")
    let progress = 0
    const timer = setInterval(() => {
        progress += 10
        bar.style.width = progress + "%"
        if (progress >= 100) {
            clearInterval(timer)
            window.location.href = url
        }
    }, 150)
}
