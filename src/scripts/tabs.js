export default () => {
    const myTabs = document.querySelectorAll('ul.nav-tabs > li');
    const tabPanes = document.querySelectorAll('.tab-pane');

    const onTabClick = (e) => {
        e.preventDefault();

        for (let i = 0; i < myTabs.length; i += 1) {
            myTabs[i].classList.remove('active');
        }

        const currentTab = e.currentTarget;
        currentTab.classList.add('active');

        for (let i = 0; i < tabPanes.length; i += 1) {
            tabPanes[i].classList.remove('active');
        }

        const anchorReference = e.target;
        const activePaneId = anchorReference.getAttribute('href');
        const currentPane = document.querySelector(activePaneId);
        currentPane.classList.add('active');
    };

    if (myTabs) {
        for (let i = 0; i < myTabs.length; i += 1) {
            myTabs[i].addEventListener('click', onTabClick);
        }
    }
}