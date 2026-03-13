const repo = "ToyZ-95/Orbit"

let arm64
let armv7
let x86

fetch(`https://api.github.com/repos/${repo}/releases/latest`)
    .then(res => res.json())
    .then(data => {
        const changelogEl = document.getElementById("changelog")
        if (changelogEl && data.body) changelogEl.innerText = data.body

        const assets = data.assets || []
        let totalDownloads = 0

        assets.forEach(asset => {
            if (asset.name.includes("arm64")) arm64 = asset.browser_download_url
            if (asset.name.includes("armeabi")) armv7 = asset.browser_download_url
            if (asset.name.includes("x86")) x86 = asset.browser_download_url
            totalDownloads += asset.download_count || 0
        })

        const apkSizeEl = document.getElementById("apkSize")
        if (apkSizeEl && assets.length) {
            const firstApk = assets.find(a => a.name.endsWith(".apk")) || assets[0]
            apkSizeEl.textContent = "APK Size: " + (firstApk.size / 1024 / 1024).toFixed(1) + " MB"
        }

        const downloadsEl = document.getElementById("downloads")
        if (downloadsEl && totalDownloads > 0) {
            const formatted = totalDownloads >= 1000 
                ? (totalDownloads / 1000).toFixed(1).replace(/\.0$/, '') + 'K+' 
                : totalDownloads + '+'
            downloadsEl.textContent = formatted
        }
    })
    .catch(() => {})


function detectABI() {

    const ua = navigator.userAgent.toLowerCase()

    if (ua.includes("arm64") || ua.includes("aarch64"))
        return arm64

    if (ua.includes("arm"))
        return armv7

    return arm64

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
