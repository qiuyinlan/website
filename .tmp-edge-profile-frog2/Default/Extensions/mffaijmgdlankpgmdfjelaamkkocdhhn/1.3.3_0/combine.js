function _run_show_combine_popup(option = {}) {
    option.fileList = option.fileList || []
    option.title = option.title || ''
    option.bilibiliFileList = option.bilibiliFileList || []

    if (!option.hasOwnProperty("callback")) {
        option.callback = (title, mediaId, resultList) => {
            option.bilibiliFileList = []
            option.title = title
            let eps = []
            resultList.forEach(file => {
                option.bilibiliFileList.push({
                    file: new File([file.content], file.fileName),
                    longTitle: file.longTitle,
                    i: file.i
                })
                let ep = file.ep
                ep.Dms = file.nodes
                eps.push(ep)
                // nodes["" + file.i] = file.nodes
            })

            if (mediaId && title && eps.length) {
                setTimeout(() => {
                    postDm({
                        "MediaId": "" + mediaId,
                        "Title": title,
                        "Eps": eps
                    })
                }, 1)
            }
            refreshTable(option.bilibiliFileList, '_ext-bilibili-file-list-tbody')
        }
    }

    _run__script_(option)

    if (!option.bilibiliFileList.length) {
        option.bilibiliFileList.push({file: new File(["文件名01"], "文件名01")})
        option.bilibiliFileList.push({file: new File(["文件名02, test content"], "文件名02,")})
        option.bilibiliFileList.push({file: new File(["文件名03"], "文件名03")})
    }

    fetch(chrome.runtime.getURL('/combine.html'))
        .then(r => r.text())
        .then(html => {
            //append html to
            document.body.insertAdjacentHTML('beforeend', html);

            document.getElementById('_ext-combine-close').addEventListener('click', e => {
                document.getElementById('_ext-combine-wrap').remove();
            });

            document.getElementById('_ext-download-combine').addEventListener('click', e => {
                mergeFiles(option.bilibiliFileList, option.fileList).then(subBtnTriggerHandler).catch(console.log)
            });

            document.getElementById('_ext-filesInput').addEventListener('change', e => {
                e.preventDefault();

                Array.from(e.target.files || e.dataTransfer.files).forEach(file => {
                    option.fileList.push({file});
                    renameInputFillWhenEmpty(option);
                });

                e.target.value = '';

                refreshTable(option.fileList, '_ext-file-list-tbody')
            });

            Sortable.create(document.getElementById('_ext-bilibili-file-list-tbody'), {
                draggable: 'tr',
                animation: 100,
                onEnd: (e) => {
                    let sourceEl = option.bilibiliFileList.splice(e.newIndex, 1, option.bilibiliFileList[e.oldIndex]);
                    option.bilibiliFileList.splice(e.oldIndex, 1);
                    option.bilibiliFileList.splice(e.oldIndex > e.newIndex ? e.newIndex + 1 : e.newIndex - 1, 0, sourceEl[0]);
                    refreshTable(option.bilibiliFileList, '_ext-bilibili-file-list-tbody')
                },
            });

            Sortable.create(document.getElementById('_ext-file-list-tbody'), {
                draggable: 'tr',
                animation: 100,
                onEnd: (e) => {
                    let sourceEl = option.fileList.splice(e.newIndex, 1, option.fileList[e.oldIndex]);
                    option.fileList.splice(e.oldIndex, 1);
                    option.fileList.splice(e.oldIndex > e.newIndex ? e.newIndex + 1 : e.newIndex - 1, 0, sourceEl[0]);
                    refreshTable(option.fileList, '_ext-file-list-tbody')
                },
            });

            //todo !!!!!!!!!!!!!!!!!!!!!!!!! remove it
            refreshTable(option.bilibiliFileList, '_ext-bilibili-file-list-tbody')
        })

    function renameInputFillWhenEmpty(option = {}) {
        if (option.fileList.length && document.getElementById('_ext-rename-to').value === "") {
            let names = []
            for (let file of option.fileList) {
                names.push(file.file.name)
            }
            document.getElementById('_ext-rename-to').value = getNewFileName(names);
        }
    }

    function getNewFileName(names) {
        if (!names.length) {
            return ''
        }

        for (let name of names) {
            //xxxxx[01]xxxx
            //xxxxx[010]xxxx
            let res = new RegExp(/\[([0-9][0-9][0-9]?)]/).exec(name)
            if (res && res.length > 1) {
                return convertNewFilename(res.input, res.index, res[1])
            }

            //xxxxx01xxxx
            //xxxxx09xxxx
            res = new RegExp(/[^0-9](0[1-9])[^0-9]/).exec(name)
            if (res && res.length > 1) {
                return convertNewFilename(res.input, res.index, res[1])
            }
        }
        return names[0]
    }

    function convertNewFilename(input, index, hit) {
        return input.replace(hit, '#'.repeat(hit.length))
    }

    function mergeFiles(bilibiliFiles, assFiles) {
        return new Promise(async (resolve, reject) => {
            let newFileList = [];
            for (let index = 0; index < bilibiliFiles.length; index++) {
                let bilibiliContent = await readFile(bilibiliFiles[index].file)
                if (!bilibiliContent.length) {
                    reject(new Error("bilibili 弹幕文件为空或解析失败"))
                    return
                }
                let assContent;
                if (assFiles[index]) {
                    assContent = await readFile(assFiles[index].file)
                }
                if (assContent && assContent.length) {
                    newFileList.push(new File([bilibiliContent.trim() + "\n" + subConvert(assContent.trim().split(/\r\n|\n/)).join("\n")], "" + index));
                } else {
                    //文件不对齐则保留 bilibili 的
                    newFileList.push(new File([bilibiliContent], "" + index));
                }
            }

            resolve(newFileList.sort((a, b) => {
                //根据文件名排序
                if (parseInt(a.name) < parseInt(b.name)) {
                    return -1;
                }
                if (parseInt(a.name) > parseInt(b.name)) {
                    return 1;
                }
                return 0;
            }))
        });
    }

    function readFile(blob) {
        return new Promise((resolve, reject) => {
            let file = new FileReader();
            file.onload = e => resolve(e.target.result)
            file.onerror = reject;
            file.readAsText(blob);
        });
    }

    function subConvert(lines) {
        //读取分辨率
        let resTimes = 1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().toLowerCase().startsWith('playresx:')) {
                resTimes = 1920 / parseInt(lines[i].trim().toLowerCase().substring(9));
                if (isNaN(resTimes)) {
                    resTimes = 1;
                }
                break;
            }
        }

        let newList = [];
        lines.forEach(line => {
            line = line.trim();
            let lowerLine = line.toLowerCase();
            if (
                lowerLine.startsWith('[v4+ styles]')
                || lowerLine.startsWith('format:')
                || lowerLine.startsWith('style:')
                || lowerLine.startsWith('[events]')
                || lowerLine.startsWith('dialogue:')
                || lowerLine === ""
            ) {

                // 缩放字体
                if (lowerLine.startsWith('style:')) {
                    let fontSizeRes = line.match(/,\s?(\d+)\s?,/);
                    if (!!fontSizeRes) {
                        let fontSize = fontSizeRes[1] * resTimes;
                        if (fontSize > 50) {
                            fontSize = 50;//默认都太大了
                            // fontSize *= 0.85//默认都太大了

                            //todo 需要在小尺寸屏幕检查字体大小是否正常 !!!!!!!!!!!!!!

                        }
                        line = line.replace(/,\s?\d+\s?,/, ',' + Math.floor(fontSize) + ',');
                    }
                }
                newList.push(line);
            }
        });

        return newList;
    }


    function refreshTable(fileItems, elementId) {
        let el = document.getElementById(elementId);
        el.innerHTML = "";

        fileItems.forEach((item) => {
            let tr = document.createElement("tr")
            let td1 = document.createElement("td")
            td1.textContent = item.file.name
            tr.appendChild(td1)
            let td2 = document.createElement("td")
            td2.textContent = fileSizeH(item.file.size)
            td2.className = 'td-size'
            tr.appendChild(td2)
            el.appendChild(tr)
        })
    }

    function subBtnTriggerHandler(files) {
        download(fileListRename(files, document.getElementById('_ext-rename-to').value, document.getElementById('_ext-rename-start-index').value), null);
    }

    function download(files, callback) {
        let zip = new JSZip();
        for (let i in files) {
            if (files.hasOwnProperty(i)) {
                zip.file(i, files[i])
            }
        }

        zip.generateAsync({type: "blob"}).then((blob) => { // 1) generate the zip file
            saveAs(blob, "flysay.com" + ".zip");
            callback && callback()
        }, (err) => {
            console.log(err)
        });
    }

    function fileListRename(fileList, sourceName, startIndex) {
        startIndex = parseFloat(startIndex);
        if (isNaN(startIndex)) {
            startIndex = 1;
        }

        let jsonFileList = {};
        let match = sourceName.match(/#+/);
        let fileName = sourceName;

        fileList.forEach((file, index) => {
            if (match) {
                let len = match[0].length;
                let i = match['index'];
                let strNumber = '' + (index + startIndex);
                let pad = strNumber;
                for (let ii = 0; ii < len - strNumber.length; ii++) {
                    pad = '0' + pad;
                }

                fileName = sourceName.substring(0, i) + pad + sourceName.substring(i + len);
            }
            jsonFileList[fileName] = file
        });
        return jsonFileList;
    }

    function fileSizeH(size) {
        let kbUnit = size / 1024;
        let unit = 'KB';
        if (kbUnit > 1024) {
            kbUnit /= 1024;
            unit = 'MB';
        }
        return kbUnit.toFixed(2) + unit;
    }
}

// (function (option = {}) {
//     _run_show_combine_popup(option)
//
//     console.log(getRandomInt(1, 123))
// })({})

