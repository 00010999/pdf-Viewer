const fs = require('fs');
const path = require('path');

// 1. Create file_paths.xml for FileProvider
const xmlDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'xml');
if (!fs.existsSync(xmlDir)) {
  fs.mkdirSync(xmlDir, { recursive: true });
}

const filePathsContent = `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <files-path name="files" path="." />
    <cache-path name="cache" path="." />
    <external-files-path name="external_files" path="." />
    <external-cache-path name="external_cache" path="." />
    <external-path name="external" path="." />
</paths>
`;
fs.writeFileSync(path.join(xmlDir, 'file_paths.xml'), filePathsContent, 'utf8');
console.log('Created android/app/src/main/res/xml/file_paths.xml');

// 2. Patch AndroidManifest.xml
const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
let manifest = fs.readFileSync(manifestPath, 'utf8');

// Add requestLegacyExternalStorage="true" if not present
if (!manifest.includes('android:requestLegacyExternalStorage')) {
  manifest = manifest.replace('<application', '<application android:requestLegacyExternalStorage="true"');
}

// Add FileProvider before </application> if not present
const providerTag = `
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
`;
if (!manifest.includes('androidx.core.content.FileProvider')) {
  manifest = manifest.replace('</application>', `${providerTag}\n    </application>`);
}

// Add permissions before </manifest> if not present
const permissions = `
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />
`;
if (!manifest.includes('android.permission.CAMERA')) {
  manifest = manifest.replace('</manifest>', `${permissions}\n</manifest>`);
}

fs.writeFileSync(manifestPath, manifest, 'utf8');
console.log('Successfully patched AndroidManifest.xml with FileProvider and storage permissions');
