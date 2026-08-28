import { Template, defaultBuildLogger } from 'e2b'
import { template } from './template'

async function main() {
  await Template.build(template, 'v0-clone-build', {
    onBuildLogs: defaultBuildLogger(),
  });
}

main().catch(console.error);
