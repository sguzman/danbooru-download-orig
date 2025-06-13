// ==UserScript==
// @name         Danbooru Gallery Downloader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a download button to gallery images on Danbooru to download the original version.
// @author       You
// @match        https://danbooru.donmai.us/posts*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// ==/UserScript==

(function() {
    'use strict';

    // Function to fetch the post page and find the original image URL
    function downloadOriginalImage(postUrl) {
        GM_xmlhttpRequest({
            method: "GET",
            url: postUrl,
            onload: function(response) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, "text/html");
                const originalImageLink = doc.querySelector('#post-option-view-original a');

                if (originalImageLink) {
                    const originalImageUrl = originalImageLink.href;
                    const fileName = originalImageUrl.split('/').pop().split('?')[0];
                    console.log('Downloading:', originalImageUrl);
                    GM_download(originalImageUrl, fileName);
                } else {
                    console.log('Original image link not found on page:', postUrl);
                }
            }
        });
    }

    // Find all image previews and add a download button
    document.querySelectorAll('.post-preview').forEach(function(preview) {
        const link = preview.querySelector('a');
        if (link) {
            const postUrl = link.href;

            const button = document.createElement('button');
            button.innerText = 'Download Original';
            button.style.position = 'absolute';
            button.style.bottom = '10px';
            button.style.right = '10px';
            button.style.zIndex = '1000';
            button.style.padding = '5px';
            button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '5px';
            button.style.cursor = 'pointer';

            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                downloadOriginalImage(postUrl);
            });

            link.style.position = 'relative';
            link.appendChild(button);
        }
    });
})();
