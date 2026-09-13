/**
 * Professional Hardware & Client Device Fingerprinting Utility
 * Computes deterministic, high-entropy device signature per browser/machine
 */

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  os: string;
  browser: string;
  resolution: string;
  timeZone: string;
  platform: string;
  fingerprintHash: string;
}

export async function getDeviceFingerprint(agentId: string): Promise<DeviceInfo> {
  const nav = typeof window !== 'undefined' ? window.navigator : ({} as any);
  const screenObj = typeof window !== 'undefined' ? window.screen : ({} as any);

  // 1. Detect OS
  let os = 'Unknown OS';
  const ua = nav.userAgent || '';
  if (/windows phone/i.test(ua)) os = 'Windows Phone';
  else if (/win/i.test(ua)) os = 'Windows PC';
  else if (/android/i.test(ua)) os = 'Android Device';
  else if (/ipad|iphone|ipod/i.test(ua)) os = 'Apple iOS';
  else if (/mac/i.test(ua)) os = 'Apple macOS';
  else if (/linux/i.test(ua)) os = 'Linux OS';

  // 2. Detect Browser
  let browser = 'Unknown Browser';
  if (/edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Apple Safari';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';

  const resolution = `${screenObj.width || 0}x${screenObj.height || 0} @${window.devicePixelRatio || 1}x`;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const platform = nav.platform || 'web';
  const concurrency = nav.hardwareConcurrency || 4;
  const memory = (nav as any).deviceMemory || 4;
  const language = nav.language || 'en';

  // 3. Stable persistent local seed
  let localSeed = localStorage.getItem('mobcash_hardware_seed');
  if (!localSeed) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    localSeed = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('mobcash_hardware_seed', localSeed);
  }

  // 4. Combined entropy payload
  const entropy = `${agentId}|${os}|${browser}|${platform}|${resolution}|${timeZone}|${concurrency}|${memory}|${language}|${localSeed}`;

  // 5. Compute SHA-256 hash using native Web Crypto API
  let fingerprintHash = '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(entropy);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    fingerprintHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    fingerprintHash = Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  const deviceId = `DEV_${fingerprintHash.substring(0, 16).toUpperCase()}`;
  const deviceName = `${os} - ${browser} (${timeZone.split('/').pop() || timeZone})`;

  return {
    deviceId,
    deviceName,
    os,
    browser,
    resolution,
    timeZone,
    platform,
    fingerprintHash,
  };
}

/**
 * Generate a cryptographically formatted unique security activation code
 * tied to the specific agent account and device signature.
 * Format: MC-XXXX-XXXX (e.g., MC-8F92-K4B7)
 */
export function generateDeviceActivationCode(agentId: string, fingerprintHash: string): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // base32 without confusing 0/O, 1/I
  let seed = 0;
  for (let i = 0; i < agentId.length; i++) {
    seed = (seed * 31 + agentId.charCodeAt(i)) >>> 0;
  }
  for (let i = 0; i < fingerprintHash.length; i++) {
    seed = (seed * 17 + fingerprintHash.charCodeAt(i)) >>> 0;
  }

  let code = 'MC-';
  for (let i = 0; i < 4; i++) {
    const rand = (seed ^ (i * 997)) >>> 0;
    code += chars.charAt(rand % chars.length);
    seed = (seed * 1664525 + 1013904223) >>> 0;
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    const rand = (seed ^ (i * 503)) >>> 0;
    code += chars.charAt(rand % chars.length);
    seed = (seed * 1664525 + 1013904223) >>> 0;
  }

  return code;
}
