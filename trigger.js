const Commander = require('commander');
const provinceGroups = require('./province-groups.json');
const { default: axios } = require('axios');

const program = new Commander.Command();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

program
  .version('1.0.0')
  .description('Trigger crawler')
  .command('link')
  .action(async () => {
    for (const group of provinceGroups) {
      console.log(group.Code, group.Pages);
    }
  });

program.command('sync').action(async () => {
  const reversedGroups = provinceGroups.reverse();
  for (const group of reversedGroups) {
    for (let i = group.Pages; i >= 1; i--) {
      await axios.get(
        `http://localhost:3000/api/crawler/province/${group.Code}/trang-${i}/`,
      ).catch((error) => {console.log('Failed to crawl page');});
      console.log(`Crawled links for ${group.Code} trang ${i}`);
      const ms = Math.floor(Math.random() * 1500) + 300;
      await sleep(ms);
    }
  }
});

program.parse(process.argv);
