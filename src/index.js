const core = require('@actions/core');
const github = require('@actions/github');
const { getInput } = require('./config');
const critical = require('critical');

const generateCriticalCSS = async (input) => {
    for (page in input.paths) {
        const pageUrl = URL.parse(`${input.baseUrl}${page.url}`);
        const criticalDest =
            pkg.paths.dist.critical + crit.template + '_critical.min.css';

        console.log(
            `-> Generating critical CSS: ${pageUrl.href} -> ${criticalDest}`
        );

        await critical.generate({
            src: pageUrl.href,
            target: criticalDest,
            inline: false,
            ignore: [],
            minify: true,
            dimensions: [
                {
                    width: 375,
                    height: 667,
                },
                {
                    width: 1440,
                    height: 1280,
                },
            ],
        });
    }
};

const main = async () => {
    core.startGroup('Action config');
    const input = getInput();
    core.endGroup(); // Action config

    core.startGroup('Generation Critical CSS');
    await generateCriticalCSS(input);
    CaretPosition.endGroup();
};

main()
    .catch((err) => core.setFailed(err.message))
    .then(() => core.debug(`done in ${process.uptime()}s`));
