const repo = "ToyZ-95/good-life"

let arm64
let armv7
let x86

fetch(`https://api.github.com/repos/${repo}/releases/latest`)
    .then(res => res.json())
    .then(data => {

        document.getElementById("changelog").innerText = data.body

        data.assets.forEach(asset => {

            if (asset.name.includes("arm64"))
                arm64 = asset.browser_download_url

            if (asset.name.includes("armeabi"))
                armv7 = asset.browser_download_url

            if (asset.name.includes("x86"))
                x86 = asset.browser_download_url

            document.getElementById("apkSize").innerText =
                "APK Size: " + (asset.size / 1024 / 1024).toFixed(1) + " MB"

        })

    })


function detectABI() {

    const ua = navigator.userAgent.toLowerCase()

    if (ua.includes("arm64") || ua.includes("aarch64"))
        return arm64

    if (ua.includes("arm"))
        return armv7

    return arm64

}


document.getElementById("installBtn").onclick = () => {

    let url = detectABI()

    let bar = document.getElementById("progressBar")

    let progress = 0

    let timer = setInterval(() => {

        progress += 10
        bar.style.width = progress + "%"

        if (progress >= 100) {

            clearInterval(timer)

            window.location = url

        }

    }, 150)

}