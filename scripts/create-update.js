import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { execSync } from 'child_process';

// Configuration
const config = {
  buildCommand: 'npm run build',
  buildDir: 'dist', // or 'dist' depending on your setup
  updateDir: 'public/updates',
  versionFile: 'public/version.json'
};

async function createUpdate() {
  try {
    // 1. Build the project
    console.log('Building project...');
    execSync(config.buildCommand, { stdio: 'inherit' });

    // 2. Create updates directory if it doesn't exist
    if (!fs.existsSync(config.updateDir)) {
      fs.mkdirSync(config.updateDir, { recursive: true });
    }

    // 3. Read current version from version.json
    const versionData = JSON.parse(fs.readFileSync(config.versionFile, 'utf8'));
    const currentVersion = versionData.version;

    // 4. Create zip file
    const zipFileName = `update-${currentVersion}.zip`;
    const zipFilePath = path.join(config.updateDir, zipFileName);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    output.on('close', () => {
      console.log(`Update package created: ${zipFilePath}`);
      console.log(`Total size: ${archive.pointer()} bytes`);

      // 5. Update version.json
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

    // Add build directory to zip
    archive.directory(config.buildDir, false);

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