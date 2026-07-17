chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        // if (changeInfo.status === 'complete' && tab.active) {
        // do your things
        console.log(tab)

        // <script async defer src="/js/JSZip/jszip.min.js"></script>
        // <script async defer src="/js/JSZipUtils/jszip-utils.min.js"></script>
        // <script async defer src="/js/FileSaver/FileSaver.js"></script>
        // <script src="/js/Sortable/Sortable.min.js"></script>

        // chrome.scripting.executeScript({
        //     target: {tabId: tabId},
        //     files: ['combine.js']
        // })
    }
})
