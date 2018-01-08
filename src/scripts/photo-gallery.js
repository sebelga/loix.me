
// find nearest parent element
const closest = (el, fn) => (
    el && (fn(el) ? el : closest(el.parentNode, fn))
);

const initPhotoswipe = (gallerySelector) => {
    const parseThumbnailElements = (el) => {
        const linkElements = Array.from(el.childNodes).filter(n => n.nodeType === 1);
        const numNodes = linkElements.length;
        const items = [];
        let linkEl;
        let size;

        for (let i = 0; i < numNodes; i += 1) {
            linkEl = linkElements[i];

            size = linkEl.getAttribute('data-size').split('x');

            const item = {
                src: linkEl.getAttribute('href'),
                w: parseInt(size[0], 10),
                h: parseInt(size[1], 10),
            };

            if (linkEl.children.length > 0) {
                item.msrc = linkEl.children[0].getAttribute('src');
            }

            item.el = linkEl;
            items.push(item);
        }

        return items;
    };

    const openPhotoSwipe = (index, galleryElement, disableAnimation, fromURL) => {
        const pswpElement = document.querySelectorAll('.pswp')[0];
        const items = parseThumbnailElements(galleryElement);

        if (items.length === 0) {
            return;
        }

        const options = {
            galleryUID: galleryElement.getAttribute('data-pswp-uid'),
            getThumbBoundsFn: (i) => {
                const thumbnail = items[i].el.getElementsByTagName('img')[0];
                const pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
                const rect = thumbnail.getBoundingClientRect();

                return {
                    x: rect.left,
                    y: rect.top + pageYScroll,
                    w: rect.width,
                };
            },
        };

        if (fromURL) {
            options.index = parseInt(index, 10) - 1;
        } else {
            options.index = parseInt(index, 10);
        }

        // exit if index not found
        if (isNaN(options.index)) {
            return;
        }

        if (disableAnimation) {
            options.showAnimationDuration = 0;
        }

        const gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
        gallery.init();
    };

    const onThumbnailsClick = (e) => {
        e = e || window.event;
        if (e.preventDefault) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }

        const eTarget = e.target || e.srcElement;

        // find root element of slide
        const clickedListItem = closest(eTarget, el => (
            el.tagName && el.tagName.toUpperCase() === 'A'
        ));
        if (!clickedListItem) {
            return;
        }
        const clickedGallery = clickedListItem.parentNode;
        const index = parseInt(clickedListItem.getAttribute('data-index'), 10);

        if (index >= 0) {
            openPhotoSwipe(index, clickedGallery);
        }
    };

    const photoSwipeParseHash = () => {
        const hash = window.location.hash.substring(1);
        const params = {};

        if (hash.length < 5) {
            return params;
        }

        const vars = hash.split('&');
        for (let i = 0; i < vars.length; i += 1) {
            if (vars[i]) {
                const pair = vars[i].split('=');
                if (pair.length >= 2) {
                    const [k, v] = pair;
                    params[k] = v;
                }
            }
        }

        if (params.gid) {
            params.gid = parseInt(params.gid, 10);
        }

        return params;
    };

    // Loop through all gallery elements and bind click events
    const galleryElements = document.querySelectorAll(gallerySelector);

    for (let i = 0; i < galleryElements.length; i += 1) {
        galleryElements[i].setAttribute('data-pswp-uid', i + 1);
        galleryElements[i].onclick = onThumbnailsClick;
    }

    const hashData = photoSwipeParseHash();

    if (hashData.pid && hashData.gid) {
        openPhotoSwipe(hashData.pid, galleryElements[hashData.gid - 1], true, true);
    }
};

const init = () => {
    initPhotoswipe('.c-photo-gallery');
};

export default init;
