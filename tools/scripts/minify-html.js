const fs = require('fs');
const path = require('path');
const glob = require('glob');

const { minify } = require('html-minifier');

const folder = path.join(process.cwd(), 'public');

const result = minify('<p title="blah" id="moo">foo</p>', {
    removeAttributeQuotes: true
});

const options = {
    removeEmptyElements: true,
    removeComments: true,
    collapseWhitespace: true
};

glob('**/*.html', { cwd: folder, nodir: true }, (err, files) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    files.forEach((file) => {
        const origin = path.join(folder, file);
        const dest = path.join(folder, file);

        const data = fs.readFileSync(origin, 'utf-8');
        const minified = minify(data, options);
        fs.writeFileSync(dest, minified);
    });
});

