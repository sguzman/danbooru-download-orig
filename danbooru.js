// ==UserScript==
// @name         Danbooru Gallery Downloader (with Tracking)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Adds a custom-styled download button that turns red after downloading.
// @author       You
// @match        https://danbooru.donmai.us/posts*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(async function() {
    'use strict';

    // --- Inject our custom CSS into the page ---
    // A new ".tm-downloaded" class is added for the "already downloaded" state.
    GM_addStyle(`
        .tm-download-button {
            position: absolute;
            bottom: 10px;
            right: 10px;
            z-index: 1000;
            padding: 8px 12px;
            background-color: #0073ff; /* Blue for "not downloaded" */
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            opacity: 0.85;
            transition: all 0.2s ease-in-out;
        }

        .tm-download-button:hover {
            background-color: #4da1ff; /* Lighter blue on hover */
            opacity: 1;
        }

        /* This is the new style for a button whose image has been downloaded */
        .tm-download-button.tm-downloaded,
        .tm-download-button.tm-downloaded:hover {
            background-color: #c82333; /* Red to indicate "downloaded" */
            opacity: 0.75;
            cursor: default; /* Change cursor to show it's a completed action */
        }
    `);

    // --- Core Logic ---

    // Get the list of downloaded post IDs from storage. Use an async IIFE to use await.
    const downloadedPosts = await GM_getValue('danbooruDownloadedPosts', []);

    // Function to mark a post as downloaded and save it
    async function markAsDownloaded(postId, button) {
        // Add the new class to the button for instant visual feedback
        button.classList.add('tm-downloaded');

        // Add the ID to our list if it's not already there
        if (!downloadedPosts.includes(postId)) {
            downloadedPosts.push(postId);
            await GM_setValue('danbooruDownloadedPosts', downloadedPosts);
        }
    }

    // Function to fetch the post page and initiate the download
    function downloadOriginalImage(postUrl, postId, button) {
        GM_xmlhttpRequest({
            method: "GET",
            url: postUrl,
            onload: function(response) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.responseText, "text/html");
                const originalImageLink = doc.querySelector('#post-option-view-original a');

                if (originalImageLink && originalImageLink.href) {
                    const originalImageUrl = originalImageLink.href;
                    const fileName = originalImageUrl.split('/').pop().split('?')[0];

                    console.log('Downloading:', originalImageUrl);

                    // Use GM_download and when it completes, mark the image
                    GM_download({
                        url: originalImageUrl,
                        name: fileName,
                        onload: function() {
                            // This runs after the download is successful
                            markAsDownloaded(postId, button);
                        },
                        onerror: function(err) {
                            console.error('Download failed:', err);
                        }
                    });
                } else {
                    console.error('Original image link not found on page:', postUrl);
                }
            }
        });
    }

    // Find all image previews and add a download button
    document.querySelectorAll('.post-preview').forEach(function(preview) {
        const link = preview.querySelector('a');
        if (link) {
            const postUrl = link.href;
            const postId = postUrl.split('/').pop(); // Extract the post ID from the URL

            if (!postId) return; // Skip if we can't get an ID

            const button = document.createElement('button');
            button.innerText = 'Download';
            button.className = 'tm-download-button';

            // *** Check if this image was downloaded before ***
            if (downloadedPosts.includes(postId)) {
                button.classList.add('tm-downloaded');
            }

            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Don't re-download if it's already marked
                if (button.classList.contains('tm-downloaded')) {
                    console.log(`Post ${postId} already downloaded.`);
                    return;
                }

                downloadOriginalImage(postUrl, postId, button);
            });

            link.style.position = 'relative';
            link.appendChild(button);
        }
    });
})();
