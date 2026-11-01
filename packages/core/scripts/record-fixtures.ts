#!/usr/bin/env node
// Script to record API fixtures for testing

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

interface FixtureSet {
  npm: {
    metadata: unknown;
    latest: unknown;
  };
  downloads: unknown;
  github?: unknown;
  osv: unknown;
}

async function recordFixtures(packageName: string, version: string): Promise<void> {
  const fixtures: FixtureSet = {
    npm: { metadata: null, latest: null },
    downloads: null,
    github: null,
    osv: null,
  };

  console.log(`Recording fixtures for ${packageName}@${version}...`);

  // Fetch npm metadata
  try {
    const metadataUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
    const metadataRes = await fetch(metadataUrl, {
      headers: {
        Accept: 'application/vnd.npm.install-v1+json',
      },
    });
    fixtures.npm.metadata = await metadataRes.json();
    console.log('✓ npm metadata');
  } catch (error) {
    console.error('✗ npm metadata:', error);
  }

  // Fetch npm latest
  try {
    const latestUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`;
    const latestRes = await fetch(latestUrl);
    fixtures.npm.latest = await latestRes.json();
    console.log('✓ npm latest');
  } catch (error) {
    console.error('✗ npm latest:', error);
  }

  // Fetch downloads
  try {
    const downloadsUrl = `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`;
    const downloadsRes = await fetch(downloadsUrl);
    fixtures.downloads = await downloadsRes.json();
    console.log('✓ npm downloads');
  } catch (error) {
    console.error('✗ npm downloads:', error);
  }

  // Fetch GitHub data if repo is available
  const repoUrl = extractRepoUrl(fixtures.npm.latest);
  if (repoUrl) {
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken) {
      try {
        const parsed = parseGitHubUrl(repoUrl);
        if (parsed) {
          const query = `
            query {
              repository(owner: "${parsed.owner}", name: "${parsed.name}") {
                isArchived
                isDisabled
                pushedAt
                latestRelease {
                  tagName
                  publishedAt
                }
              }
            }
          `;

          const githubRes = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${githubToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
          });

          fixtures.github = await githubRes.json();
          console.log('✓ GitHub');
        }
      } catch (error) {
        console.error('✗ GitHub:', error);
      }
    } else {
      console.log('⊘ GitHub (no token)');
    }
  }

  // Fetch OSV vulnerabilities
  try {
    const osvRes = await fetch('https://api.osv.dev/v1/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        package: {
          name: packageName,
          ecosystem: 'npm',
        },
        version,
      }),
    });
    fixtures.osv = await osvRes.json();
    console.log('✓ OSV');
  } catch (error) {
    console.error('✗ OSV:', error);
  }

  // Save to file
  const fixturesDir = join(process.cwd(), 'fixtures');
  await mkdir(fixturesDir, { recursive: true });

  const filename = `${packageName.replace(/[@/]/g, '-')}@${version}.json`;
  const filepath = join(fixturesDir, filename);

  await writeFile(filepath, JSON.stringify(fixtures, null, 2));
  console.log(`\n✓ Saved to ${filepath}`);
}

function extractRepoUrl(latest: any): string | null {
  if (!latest?.repository) return null;

  if (typeof latest.repository === 'string') {
    return latest.repository;
  }

  if (typeof latest.repository === 'object' && latest.repository.url) {
    return latest.repository.url;
  }

  return null;
}

function parseGitHubUrl(url: string): { owner: string; name: string } | null {
  try {
    // Handle various GitHub URL formats
    let normalized = url;
    if (url.startsWith('github:')) {
      normalized = `https://github.com/${url.slice(7)}`;
    }
    if (url.startsWith('git+')) {
      normalized = url.slice(4);
    }
    if (url.startsWith('git://')) {
      normalized = url.replace('git://', 'https://');
    }
    if (normalized.endsWith('.git')) {
      normalized = normalized.slice(0, -4);
    }

    const urlObj = new URL(normalized);
    if (urlObj.hostname !== 'github.com') return null;

    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;

    return {
      owner: parts[0],
      name: parts[1],
    };
  } catch {
    return null;
  }
}

// Main
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: record-fixtures.ts <package-name> <version>');
  console.error('Example: record-fixtures.ts lodash 4.17.21');
  process.exit(1);
}

const [packageName, version] = args;
recordFixtures(packageName, version).catch((error) => {
  console.error('Failed to record fixtures:', error);
  process.exit(1);
});
