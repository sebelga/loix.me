export default () => {
    const rotateWords = document.querySelector('.rotate-words');

    if (rotateWords) {
        const words = rotateWords.querySelectorAll('span');
        words[0].classList.add('active');

        setInterval(() => {
            const current = rotateWords.querySelector('.active');
            const { nextElementSibling } = current;
            const nextIndex = nextElementSibling ? Array.prototype.indexOf.call(words, nextElementSibling) : 0;

            current.classList.add('rotate-out');
            current.classList.remove('rotate-in');
            current.classList.remove('active');
            words[nextIndex].classList.add('rotate-in');
            words[nextIndex].classList.add('active');
            words[nextIndex].classList.remove('rotate-out');
        }, 3000);
    }
};
