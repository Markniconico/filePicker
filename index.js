const doms = {
    dragContainer: document.querySelector('.drag_container'),
    filePickButton: document.querySelector('#file_picker'),
    directoryPickButton: document.querySelector('#directory_picker'),
    body: document.body
}


const render = debounce(renderFileList, 300);
let fileList = new Proxy([], {
    get(target, key) {
        return Reflect.get(target, key);
    },
    set(target, key, value) {
        render();
        return Reflect.set(target, key, value);
    }
})

//需要阻止浏览器默认行为
doms.dragContainer.ondragenter = e => {
    e.preventDefault();
}
doms.dragContainer.ondragover = e => {
    e.preventDefault();
}
doms.dragContainer.ondrop = e => {
    e.preventDefault();
    for (const item of e.dataTransfer.items) {
        const entry = item.webkitGetAsEntry();
        consolidateFiles(entry)
    }
}
doms.filePickButton.oninput = e => {
    fileList.push(...doms.filePickButton.files)
}
doms.directoryPickButton.oninput = e => {
    fileList.push(...doms.directoryPickButton.files)
}

function consolidateFiles(entry) {
    if (entry.isDirectory) { //目录
        //读取到目录里的文件
        const reader = entry.createReader();
        reader.readEntries(entries => {
            for (const fileEntry of entries) {
                consolidateFiles(fileEntry)
            }
        })
    } else { //文件
        entry.file(f => {
            fileList.push(f)
        });
    }
}

function renderFileList() {
    const oldUl = document.querySelector('ul');
    oldUl && doms.body.removeChild(oldUl);


    const ul = document.createElement('ul');
    const fragment = document.createDocumentFragment();
    fileList.forEach(file => {
        const li = document.createElement('li');
        const status = document.createElement('p');
        status.setAttribute('class', 'status');
        status.innerText = '待上传';
        li.appendChild(status);

        if (isImage(file)) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = e => {
                const img = document.createElement('img');
                img.src = e.target.result;
                li.insertBefore(img, status);
            }
        } else {
            const name = document.createElement('p');
            name.innerText = file.name;
            li.insertBefore(name, status);
        }

        fragment.appendChild(li);
    });
    ul.appendChild(fragment);
    doms.body.appendChild(ul);
}

function debounce(func, delay) {
    let timer;
    return function() {
        let context = this;
        let args = arguments;
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
};

function isImage(file) {
    return file.type.startsWith('image/')
}