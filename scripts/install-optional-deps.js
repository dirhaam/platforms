#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Installing optional dependencies for enhanced performance...');

const optionalDeps = [
  'sharp', // For image optimization
  '@radix-ui/react-progress', // For progress components
];

const devDeps = [
  '@types/sharp', // TypeScript definitions for sharp
];

function installPackage(packageName, isDev = false) {
  try {
    console.log(`Installing ${packageName}...`);
    const command = `pnpm add ${isDev ? '-D' : ''} ${packageName}`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${packageName} installed successfully`);
  } catch (error) {
    console.warn(`⚠️  Failed to install ${packageName}:`, error.message);
    console.warn(`   You can install it manually with: pnpm add ${isDev ? '-D' : ''} ${packageName}`);
  }
}

// Install optional dependencies
optionalDeps.forEach(dep => installPackage(dep));

// Install dev dependencies
devDeps.forEach(dep => installPackage(dep, true));

console.log('\n✅ Optional dependencies installation completed!');
console.log('\nNote: Some features may be disabled if optional dependencies are not available.');
console.log('This is normal and the application will continue to work without them.');