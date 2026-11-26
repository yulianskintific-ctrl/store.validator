import { validateCoordinates } from './validation';

export interface DeviceLocation {
  longitude: number;
  latitude: number;
  accuracyMeters: number;
}

export type DeviceLocationErrorCode = 'unsupported' | 'permission_denied' | 'timeout' | 'unavailable' | 'invalid';

export class DeviceLocationError extends Error {
  constructor(public readonly code: DeviceLocationErrorCode, message: string) {
    super(message);
    this.name = 'DeviceLocationError';
  }
}

function readPosition(options: PositionOptions): Promise<DeviceLocation> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const result = { longitude: coords.longitude, latitude: coords.latitude, accuracyMeters: coords.accuracy };
        const validation = validateCoordinates(result.latitude, result.longitude);
        if (!validation.valid) reject(new DeviceLocationError('invalid', validation.error ?? 'Koordinat GPS tidak valid.'));
        else resolve(result);
      },
      (error) => {
        const code = error.code === error.PERMISSION_DENIED ? 'permission_denied'
          : error.code === error.TIMEOUT ? 'timeout' : 'unavailable';
        reject(new DeviceLocationError(code, error.message));
      },
      options,
    );
  });
}

export async function getDeviceLocation(): Promise<DeviceLocation> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new DeviceLocationError('unsupported', 'Browser ini tidak mendukung layanan lokasi.');
  }
  try {
    return await readPosition({ enableHighAccuracy: true, timeout: 12_000, maximumAge: 5_000 });
  } catch (firstError) {
    try {
      return await readPosition({ enableHighAccuracy: false, timeout: 25_000, maximumAge: 10_000 });
    } catch (secondError) {
      const first = firstError instanceof DeviceLocationError ? firstError : null;
      const second = secondError instanceof DeviceLocationError ? secondError : null;
      if (first?.code === 'permission_denied' || second?.code === 'permission_denied') {
        throw new DeviceLocationError('permission_denied', 'Izin lokasi ditolak.');
      }
      if (first?.code === 'timeout' || second?.code === 'timeout') {
        throw new DeviceLocationError('timeout', 'Pengambilan lokasi melewati batas waktu.');
      }
      throw second ?? first ?? new DeviceLocationError('unavailable', 'Gagal memperoleh lokasi perangkat.');
    }
  }
}

export function distanceMeters(latitude1: number, longitude1: number, latitude2: number, longitude2: number): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const deltaLatitude = radians(latitude2 - latitude1);
  const deltaLongitude = radians(longitude2 - longitude1);
  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(radians(latitude1)) * Math.cos(radians(latitude2)) * Math.sin(deltaLongitude / 2) ** 2;
  const boundedA = Math.min(1, Math.max(0, a));
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(boundedA), Math.sqrt(1 - boundedA));
}
