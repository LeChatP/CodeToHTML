class HtmlManager {
    constructor() {
        // body直下の最後のdivタグを取得
        const codeDiv = document.querySelectorAll('body > div')[document.querySelectorAll('body > div').length - 1];
        codeDiv.id = 'codeDiv';
        this.styleText = codeDiv.style.cssText.replace(/"/g, "'");
        this.styleText = this.styleText.replace(/white-space:.*?;/, '');
        this.styleText += 'margin: auto; width: fit-content; overflow: auto;';
        
        // replace br tag with div span
        const brs = codeDiv.querySelectorAll('br');
        for (const br of brs) {
            const span = document.createElement('span');
            span.textContent = ' ';
            br.replaceWith(span);
        }
        // add line numbers for each div element
        const tags = codeDiv.querySelectorAll('div');
        const sizeSpace = `${tags.length+1}`.length;
        for (let i = 0; i < tags.length; i++) {
            const space = `${i+1}`.length;
            const tag = tags[i];
            const lineNumber = document.createElement('span');
            lineNumber.textContent =  `${i + 1}.${" ".repeat(sizeSpace - space)}|`;
            lineNumber.style = 'position: absolute; left: -40px; color: #555; font-size: 12px;';
            tag.prepend(lineNumber);
        }
        this.defaultCodeDiv = codeDiv.cloneNode(true);
    }

    setup() {
        this.#setupBody();
        this.#setupCodeToTargetSelect();
        this.#setupDownloadHtmlButton();
        this.#setupCopyHtmlButton();
        this.#setupDownloadPdfButton();
        this.#setupDownloadImageButton();
        this.#setupTextWrapSelect();
        this.#setupMaxLengthInput();
    }

    resetCodeDiv() {
        const codeDiv = document.querySelector('#codeDiv');
        codeDiv.replaceWith(this.defaultCodeDiv.cloneNode(true));
        codeDiv.style.cssText = this.styleText;
    }

    #setupBody() {
        const body = document.querySelector('body');
        body.classList.add('m-4');
    }

    #setupCodeToTargetSelect() {
        const codeToTargetSelect = document.querySelector('#codeToTargetSelect');
        codeToTargetSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            const target = document.querySelector(`#codeTo${value.charAt(0).toUpperCase() + value.slice(1)}`);
            const targets = document.querySelectorAll('.code-to-target');
            targets.forEach((target) => {
                target.classList.add('d-none');
            });
            target.classList.remove('d-none');
        });
    }

    #setupDownloadPdfButton() {
        const downloadPdfButton = document.querySelector('#downloadPdfButton');
        downloadPdfButton.addEventListener('click', async () => {
            const fontFileInput = document.querySelector('#fontFileInput');
            const htmlToPdf = new HtmlToPdf();
            if (fontFileInput.files.length > 0) {
                await htmlToPdf.setFont(fontFileInput.files[0]);
            }
            htmlToPdf.htmlToTextPdf();
        });
    }

    #setupDownloadHtmlButton() {
        const downloadHtmlButton = document.querySelector('#downloadHtmlButton');
        downloadHtmlButton.addEventListener('click', () => {
            const codeDiv = document.querySelectorAll('body > div')[document.querySelectorAll('body > div').length - 1]
            const structure = document.querySelector('#structureSelect').value;
            const html = this.#convertHtml(codeDiv, structure);
            const blob = new Blob([html], { type: 'text/html' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'code.html';
            link.click();
        });
    }

    #setupCopyHtmlButton() {
        const copyHtmlButton = document.querySelector('#copyHtmlButton');
        copyHtmlButton.addEventListener('click', () => {
            const codeDiv = document.querySelectorAll('body > div')[document.querySelectorAll('body > div').length - 1]
            const structure = document.querySelector('#structureSelect').value;
            const html = this.#convertHtml(codeDiv, structure);
            navigator.clipboard.writeText(html);
            this.#copiedPopup();
        });
    }

    #setupDownloadImageButton() {
        const downloadImageButton = document.querySelector('#downloadImageButton');
        downloadImageButton.addEventListener('click', async () => {
            const imageType = document.querySelector('#imageTypeSelect').value;

            const codeDiv = document.querySelector('#codeDiv');
            codeDiv.style.cssText = this.styleText + 'margin: 0 !important; max-width: fit-content !important; overflow: hidden !important;';

            const scale = 2;
            const options = {
                width: codeDiv.clientWidth * scale,
                height: codeDiv.clientHeight * scale,
                style: {
                    transform: 'scale(' + scale + ')',
                    transformOrigin: 'top left'
                }
            };
            let dataUrl;
            switch (imageType) {
                case 'png':
                    dataUrl = await domtoimage.toPng(codeDiv, options);
                    break;
                case 'jpeg':
                    dataUrl = await domtoimage.toJpeg(codeDiv, options);
                    break;
                case 'svg':
                    dataUrl = await domtoimage.toSvg(codeDiv, options);
                    break;
            }
            codeDiv.style.cssText = this.styleText;
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'code.' + imageType;
            link.click();
        });
    }

    #setupTextWrapSelect() {
        new TextWrap(0, false).run();
        const textWrapSelects = document.querySelectorAll('.text-wrap-select');
        textWrapSelects.forEach((textWrapSelect) => {
            textWrapSelect.addEventListener('change', (e) => {
                // codeDivをリセット
                this.resetCodeDiv();
                // すべてのtext-wrap-selectに変更された値を適用
                const value = e.target.value;
                const selects = document.querySelectorAll('.text-wrap-select');
                selects.forEach((select) => {
                    select.value = value;
                });
                const maxLengthInput = document.querySelector('.max-length-input');
                const maxLength = maxLengthInput.value;
                switch (value) {
                    case 'none':
                        new TextWrap(0, false).run();
                        break;
                    case 'normal':
                        new TextWrap(maxLength, false).run();
                        break;
                    case 'smart':
                        new TextWrap(maxLength, true).run();
                        break;
                }
            });
        });
    }

    #setupMaxLengthInput() {
        const maxLengthInputs = document.querySelectorAll('.max-length-input');
        maxLengthInputs.forEach((maxLengthInput) => {
            maxLengthInput.addEventListener('change', (e) => {
                // codeDivをリセット
                this.resetCodeDiv();
                // すべてのmax-length-inputに変更された値を適用
                const maxLength = e.target.value;
                const inputs = document.querySelectorAll('.max-length-input');
                inputs.forEach((input) => {
                    input.value = maxLength;
                });
                const textWrapSelect = document.querySelector('.text-wrap-select');
                switch (textWrapSelect.value) {
                    case 'none':
                        new TextWrap(0, false).run();
                        break;
                    case 'normal':
                        new TextWrap(maxLength, false).run();
                        break;
                    case 'smart':
                        new TextWrap(maxLength, true).run();
                        break;
                }
            });
        });
    }

    #convertHtml(codeDiv, structure) {
        let hasBody, hasPre, hasCode;
        switch (structure) {
            case "html>body>div":
                hasBody = true;
                hasPre = false;
                hasCode = false;
                break;
            case "html>body>pre":
                hasBody = true;
                hasPre = true;
                hasCode = false;
                break;
            case "html>body>pre>code":
                hasBody = true;
                hasPre = true;
                hasCode = true;
                break;
            case "div":
                hasBody = false;
                hasPre = false;
                hasCode = false;
                break;
            case "pre":
                hasBody = false;
                hasPre = true;
                hasCode = false;
                break;
            case "pre>code":
                hasBody = false;
                hasPre = true;
                hasCode = true;
                break;
        }
        let html = '';
        if (hasBody)
            html += '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="UTF-8">\n<title>CodeToHTML</title>\n</head>\n<body>\n';
        if (hasPre) {
            html += `<pre style="${this.styleText}">`;
            if (hasCode)
                html += '<code style="font-family: inherit;">';
            html += this.#brToNewLine(codeDiv);
            if (hasCode)
                html += '</code>';
            html += '</pre>';
        } else {
            const newCodeDiv = document.createElement('div');
            newCodeDiv.innerHTML = codeDiv.innerHTML;
            // TreeWalkerでspan内の空白を&nbsp;に変換
            const walker = document.createTreeWalker(newCodeDiv, NodeFilter.SHOW_TEXT, null, false);
            while (walker.nextNode()) {
                const textNode = walker.currentNode;
                if (textNode.parentNode.nodeName === 'SPAN') {
                    textNode.textContent = textNode.textContent.replace(/ /g, '\u00a0');
                }
            }
            html += `<div style="${this.styleText} white-space: nowrap;">${newCodeDiv.innerHTML}</div>`;
        }
        if (hasBody)
            html += '</body>\n</html>';
        return html;
    }

    // divやbrの改行を改行コードに変換
    #brToNewLine(codeDiv) {
        const newCodeDiv = codeDiv.cloneNode(true);
        // すべての改行コードを削除
        newCodeDiv.innerHTML = newCodeDiv.innerHTML.replace(/\n/g, '');
        // 改行コードに変換
        let html = '';
        const divs = newCodeDiv.querySelectorAll('div');
        for (const div of divs) {
            if (div.textContent.length === 0) {
                html += '\n';
                continue;
            }
            html += div.innerHTML + '\n';
        }
        return html;
    }

    // コピー完了ポップアップ
    #copiedPopup() {
        const copiedPopup = document.createElement('div');
        copiedPopup.style = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; margin: auto; width: 100px; height: 100px; background-color: #000; color: #fff; text-align: center; line-height: 50px; border-radius: 5px; z-index: 1000;';
        const copiedPopupText = document.createElement('span');
        copiedPopupText.textContent = 'Copied!';
        copiedPopupText.style = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 15px; font-weight: bold;';
        copiedPopup.appendChild(copiedPopupText);
        document.querySelector('body').appendChild(copiedPopup);
        // 徐々に透明にする
        setTimeout(() => {
            let opacity = 1;
            const timer = setInterval(() => {
                opacity -= 0.1;
                copiedPopup.style.opacity = opacity;
                if (opacity <= 0) {
                    clearInterval(timer);
                    copiedPopup.remove();
                }
            }, 80);
        }, 300);
    }
}
