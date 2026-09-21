import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { execSync } from 'child_process';

const config = {
  buildCommand: 'npm run build',
  buildDir: 'dist',  
  updateDir: 'public/updates',
  versionFile: 'public/version.json'
};

async function createUpdate() {
  try {
    console.log('Building project...');
    execSync(config.buildCommand, { stdio: 'inherit' });

    if (!fs.existsSync(config.updateDir)) {
      fs.mkdirSync(config.updateDir, { recursive: true });
    }

    const versionData = JSON.parse(fs.readFileSync(config.versionFile, 'utf8'));
    const currentVersion = versionData.version;

    const zipFileName = `update-${currentVersion}.zip`;
    const zipFilePath = path.join(config.updateDir, zipFileName);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    output.on('close', () => {
      console.log(`\nUpdate package created: ${zipFilePath}`);
      console.log(`Total size: ${archive.pointer()} bytes`);

      const newVersionData = {
        version: currentVersion,
        zipUrl: `https://codora-gamma.vercel.app/updates/${zipFileName}`
      };

      fs.writeFileSync(config.versionFile, JSON.stringify(newVersionData, null, 2));
      console.log('version.json updated successfully');
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);

    const files = [];
    const scanDir = (dir, baseDir = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = baseDir ? `${baseDir}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          scanDir(fullPath, relativePath);
        } else {
          files.push({
            path: fullPath,
            name: relativePath
          });
        }
      }
    };

    scanDir(config.buildDir);

    // Add files to archive with relative paths
    for (const file of files) {
      archive.file(file.path, { name: file.name });
    }

    await archive.finalize();

    console.log('\nUpdate package created successfully!');
    console.log('\nNext steps:');
    console.log('1. Commit and push the changes');
    console.log('2. Deploy to Vercel');
    console.log('3. Users will receive the update on next app launch');

  } catch (error) {
    console.error('Error creating update:', error);
    process.exit(1);
  }
}

createUpdate();