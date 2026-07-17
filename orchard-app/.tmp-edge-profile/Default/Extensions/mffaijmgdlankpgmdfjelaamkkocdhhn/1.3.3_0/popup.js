const optionCacheKey = "_options_cache_v3", option = {conf: {}}
let optionCache = JSON.parse(localStorage.getItem(optionCacheKey));
optionCache = (optionCache && typeof optionCache === 'object') ? optionCache : {}

for (let k in optionCache) {
    if (!optionCache.hasOwnProperty(k)) {
        continue
    }
    option[k] = optionCache[k]
    let el = document.getElementById(k)
    if (el) {
        el.value = optionCache[k]
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //conf
    if (message['conf']) {
        for (let k in message['conf']) {
            if (!message['conf'].hasOwnProperty(k)) {
                continue
            }
            option['conf'][k] = message['conf'][k]
        }
    }
    //tips
    if (Array.isArray(message['tips']) && message['tips'].length > 0) {
        document.getElementById('ext-dm-tips-wrap-point-el').innerHTML = ''
        for (let m of message['tips']) {
            let p = document.createElement('p')
            p.style.color = 'gray'
            let t = document.createTextNode(m);
            p.appendChild(t)
            document.getElementById('ext-dm-tips-wrap-point-el').append(p)
        }
    }
    //init warning
    if (message instanceof Object && message["warning"] && Array.isArray(message["warning"]) && message["warning"].length > 0) {
        document.getElementById('warning').innerHTML = ''
        for (let m of message["warning"] ) {
            let p = document.createElement('p')
            p.style.color = 'gray'
            let t = document.createTextNode(m);
            p.appendChild(t)
            document.getElementById('warning').append(p)
        }
    }
});

chrome.tabs.query({active: true, 'lastFocusedWindow': true}, (tabs) => {
    if (tabs && tabs.length && (tabs[0].url.indexOf("bilibili.com/bangumi/play/") > -1 || tabs[0].url.indexOf("bilibili.com/video/") > -1)) {
        document.getElementById("warning").style.display = "none";
        document.getElementById("main").style.display = "block";
    } else {
        document.getElementById("warning").style.display = "block";
        document.getElementById("main").style.display = "none";
    }

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            func: (v) => {
                //don't inline
                _run_get_config(v)
            },
            args: [option]
        })
    });
});

async function getLocalStorage(k) {
    return await new Promise((resolve, reject) => {
        chrome.storage.local.get(k, (items) => {
            if (items[k]) {
                resolve(items[k]);
            } else {
                reject()
            }
        });
    })
}

document.getElementById('download').onclick = async () => {
    optionCache['dm-limit'] = parseInt(document.getElementById('dm-limit').value)
    optionCache['dm-limit-prefer-old-ones'] = document.getElementById('dm-limit-prefer-old-ones').value
    optionCache['font-size'] = parseFloat(document.getElementById('font-size').value)
    optionCache['move-speed'] = parseFloat(document.getElementById('move-speed').value)
    optionCache['font-opacity'] = parseInt(document.getElementById('font-opacity').value) // .toString(16)// 0~255 => 00 ~ FF
    localStorage.setItem(optionCacheKey, JSON.stringify(optionCache))


    option["trySkip"] = document.getElementById('try-skip').checked ? 1 : 0
    option["offset"] = parseFloat(document.getElementById('offset').value)
    option["fontSize"] = optionCache['font-size']
    option["holdTimeMove"] = optionCache['move-speed']
    option["fontAlpha"] = (optionCache['font-opacity'].toString(16))
    option["limit"] = optionCache['dm-limit']
    option["limitPreferOld"] = optionCache['dm-limit-prefer-old-ones']

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            func: (v) => {
                //don't inline
                if (v?.conf?.combine) {
                    _run_show_combine_popup(v)
                } else {
                    _run__script_(v)
                }
            },
            args: [option]
        }, window.close)
    });
}
