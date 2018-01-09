import docReady from 'es6-docready';

import '../styles/main.scss';

import initPhotoGallery from './photo-gallery';
import initRotateWords from './rotate-words';

docReady(() => {
    initPhotoGallery();
    initRotateWords();
});
