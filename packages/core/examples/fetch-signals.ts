#!/usr/bin/env tsx
// Example: Fetch package signals using all data sources

import { fetchPackageSignals, fetchPackageSignalsBatch } from '../src/index.js';

async function main() {
  console.log('Fetching signals for lodash@4.17.21...\n');

  const signals = await fetchPackageSignals('lodash', '4.17.21', {
    githubToken: process.env.GITHUB_TOKEN,
  });

  console.log('Package Signals:');
  console.log('─'.repeat(50));
  console.log(`Name: ${signals.name}`);
  console.log(`Version: ${signals.resolvedVersion}`);
  console.log(`Deprecated: ${signals.deprecatedMessage || 'No'}`);
  console.log(`Last Published: ${signals.lastPublishAt?.toISOString() || 'Unknown'}`);
  console.log(`Repository: ${signals.repoUrl || 'Unknown'}`);
  console.log(`Repo Status: ${signals.repoStatus}`);
  console.log(`Last Commit: ${signals.lastCommitAt?.toISOString() || 'Unknown'}`);
  console.log(`Weekly Downloads: ${signals.weeklyDownloads?.toLocaleString() || 'Unknown'}`);
  console.log(`Vulnerabilities: ${signals.vulns.length}`);

  if (signals.vulns.length > 0) {
    console.log('\nVulnerabilities:');
    for (const vuln of signals.vulns) {
      console.log(`  - ${vuln.id} (${vuln.severity}) ${vuln.hasFix ? '✓ Fix available' : '✗ No fix'}`);
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log('\nFetching batch of packages...\n');

  const batch = await fetchPackageSignalsBatch(
    [
      { name: 'lodash', version: '4.17.21' },
      { name: 'react', version: '18.2.0' },
      { name: 'express', version: '4.18.2' },
    ],
    {
      githubToken: process.env.GITHUB_TOKEN,
      parallelLimit: 3,
    }
  );

  console.log('Batch Results:');
  console.log('─'.repeat(50));
  for (const [key, sig] of batch) {
    console.log(
      `${key.padEnd(30)} | ${sig.repoStatus.padEnd(10)} | ${sig.vulns.length} vulns | ${sig.weeklyDownloads?.toLocaleString() || 'N/A'} downloads/week`
    );
  }

  console.log('─'.repeat(50));
  console.log('\n✓ Done!');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
