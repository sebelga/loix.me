import docReady from 'es6-docready';

import '../styles/main.scss';

import plyr from '../../static/vendors/plyr/dist/plyr';
import initPhotoGallery from './photo-gallery';
import initRotateWords from './rotate-words';
import initTabs from './tabs';
import initVideoPlayer from './video-player';

window.plyr = plyr;

docReady(() => {
    initPhotoGallery();
    initRotateWords();
    initTabs();
    initVideoPlayer();
});
