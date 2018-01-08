
const initPhotoswipe = () => {
    const pswpElement = document.querySelectorAll('.pswp')[0];

    // build items array
    const items = [
        {
            src: 'https://placekitten.com/600/400',
            w: 600,
            h: 400,
        },
        {
            src: 'https://placekitten.com/1200/900',
            w: 1200,
            h: 900,
        },
    ];

    // define options (if needed)
    const options = {
        // optionName: 'option value'
        // for example:
        index: 0, // start at first slide
    };

    // Initializes and opens PhotoSwipe
    const gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
    gallery.init();
};

const initBtn = () => {
    const btnOpen = document.querySelector('.open-photo-gallery');

    btnOpen.addEventListener('click', () => {
        initPhotoswipe();
    });
};

const init = () => {
    // initPhotoswipe();
    initBtn();
};

export default init;
