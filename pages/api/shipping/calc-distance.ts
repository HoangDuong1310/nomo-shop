import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db';

// Helper: parse number safely
function toNumber(value: any, def = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : def;
}

// Calculate distance using Haversine formula
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Province/City data for Vietnam (simplified)
const vietnamLocations: { [key: string]: { lat: number; lng: number } } = {
  // Major cities
  'hà nội': { lat: 21.0285, lng: 105.8542 },
  'ha noi': { lat: 21.0285, lng: 105.8542 },
  'hồ chí minh': { lat: 10.8231, lng: 106.6297 },
  'ho chi minh': { lat: 10.8231, lng: 106.6297 },
  'sài gòn': { lat: 10.8231, lng: 106.6297 },
  'sai gon': { lat: 10.8231, lng: 106.6297 },
  'đà nẵng': { lat: 16.0544, lng: 108.2022 },
  'da nang': { lat: 16.0544, lng: 108.2022 },
  'hải phòng': { lat: 20.8449, lng: 106.6881 },
  'hai phong': { lat: 20.8449, lng: 106.6881 },
  'cần thơ': { lat: 10.0452, lng: 105.7469 },
  'can tho': { lat: 10.0452, lng: 105.7469 },
  'biên hòa': { lat: 10.9514, lng: 106.8430 },
  'bien hoa': { lat: 10.9514, lng: 106.8430 },
  'nha trang': { lat: 12.2388, lng: 109.1967 },
  'đà lạt': { lat: 11.9465, lng: 108.4419 },
  'da lat': { lat: 11.9465, lng: 108.4419 },
  'vũng tàu': { lat: 10.4114, lng: 107.1362 },
  'vung tau': { lat: 10.4114, lng: 107.1362 },
  // Districts in Ho Chi Minh City
  'quận 1': { lat: 10.7756, lng: 106.7004 },
  'quan 1': { lat: 10.7756, lng: 106.7004 },
  'quận 3': { lat: 10.7843, lng: 106.6844 },
  'quan 3': { lat: 10.7843, lng: 106.6844 },
  'quận 5': { lat: 10.7545, lng: 106.6666 },
  'quan 5': { lat: 10.7545, lng: 106.6666 },
  'quận 7': { lat: 10.7340, lng: 106.7215 },
  'quan 7': { lat: 10.7340, lng: 106.7215 },
  'quận 10': { lat: 10.7747, lng: 106.6685 },
  'quan 10': { lat: 10.7747, lng: 106.6685 },
  'tân bình': { lat: 10.8013, lng: 106.6517 },
  'tan binh': { lat: 10.8013, lng: 106.6517 },
  'gò vấp': { lat: 10.8406, lng: 106.6742 },
  'go vap': { lat: 10.8406, lng: 106.6742 },
  'phú nhuận': { lat: 10.7998, lng: 106.6800 },
  'phu nhuan': { lat: 10.7998, lng: 106.6800 },
  'bình thạnh': { lat: 10.8106, lng: 106.7091 },
  'binh thanh': { lat: 10.8106, lng: 106.7091 },
  'thủ đức': { lat: 10.8514, lng: 106.7531 },
  'thu duc': { lat: 10.8514, lng: 106.7531 },
};

// Extract location from address
function extractLocationFromAddress(address: string): { lat: number; lng: number } | null {
  const lowerAddress = address.toLowerCase();
  
  // Check for known locations
  for (const [location, coords] of Object.entries(vietnamLocations)) {
    if (lowerAddress.includes(location)) {
      return coords;
    }
  }
  
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const address = String(req.query.address || '').trim();
    if (!address) {
      return res.status(400).json({ success: false, message: 'Thiếu địa chỉ giao hàng' });
    }

    // Fetch settings
    const settingsRows = await executeQuery({
      query: 'SELECT setting_key, setting_value FROM settings WHERE setting_key IN ("store.store_lat", "store.store_lng", "shipping.free_shipping_radius", "shipping.shipping_fee_per_km")'
    });

    const settingsMap = new Map<string, string>();
    if (Array.isArray(settingsRows)) {
      for (const r of settingsRows as any[]) {
        settingsMap.set(r.setting_key, r.setting_value);
      }
    }

    const storeLat = toNumber(settingsMap.get('store.store_lat'), 0);
    const storeLng = toNumber(settingsMap.get('store.store_lng'), 0);
    const freeRadiusKm = toNumber(settingsMap.get('shipping.free_shipping_radius'), 3);
    const feePerKm = toNumber(settingsMap.get('shipping.shipping_fee_per_km'), 5000);

    // Calculate distance
    let distanceKm: number | null = null;
    let source: 'google' | 'haversine' | 'fallback' = 'fallback';
    let debugInfo: any = undefined;

    // Prefer server key first
    const mapsKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const hasKey = !!mapsKey;
    const addressLen = address.length;
    const hasStoreCoords = storeLat !== 0 && storeLng !== 0;
    const canCallMaps = hasKey && hasStoreCoords && addressLen > 0;

    // Google Maps distance calculation is disabled per business rule.
    // Keeping the code commented for reference if re-enabled in the future.
    // if (canCallMaps) {
    //   try {
    //     const origin = `${storeLat},${storeLng}`;
    //     const dest = encodeURIComponent(address);
    //     const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${dest}&mode=driving&units=metric&region=vn&language=vi&key=${mapsKey}`;
    //     const resp = await fetch(url);
    //     const data = await resp.json();
    //     const element = data && data.rows && data.rows[0] && data.rows[0].elements && data.rows[0].elements[0];
    //     if (element && element.status === 'OK' && element.distance && element.distance.value != null) {
    //       distanceKm = Math.round((element.distance.value / 1000) * 100) / 100; // km, 2 decimals
    //       source = 'google';
    //     } else {
    //       debugInfo = { 
    //         google_api_error: true,
    //         status: data?.status, 
    //         error_message: data?.error_message, 
    //         element_status: element?.status 
    //       };
    //     }
    //   } catch (e: any) {
    //     debugInfo = { google_api_error: true, fetch_error: String(e) };
    //   }
    // }

    // Fallback to Haversine formula if store coordinates are available
    if (distanceKm == null && hasStoreCoords) {
      const destLocation = extractLocationFromAddress(address);
      if (destLocation) {
        distanceKm = calculateHaversineDistance(storeLat, storeLng, destLocation.lat, destLocation.lng);
        // Apply a 1.3x multiplier to account for actual road distance vs straight line
        distanceKm = Math.round(distanceKm * 1.3 * 100) / 100;
        source = 'haversine';
        if (!debugInfo) debugInfo = {};
        debugInfo.haversine_calculation = {
          store: { lat: storeLat, lng: storeLng },
          destination: destLocation,
          straight_line_km: Math.round(distanceKm / 1.3 * 100) / 100,
          estimated_road_km: distanceKm
        };
      }
    }

    // Final fallback - estimate based on location keywords
    if (distanceKm == null) {
      const lowerAddr = address.toLowerCase();
      
      // Check for same district/area keywords
      if (lowerAddr.includes('cùng quận') || lowerAddr.includes('gần') || lowerAddr.includes('lân cận')) {
        distanceKm = 2 + Math.random() * 3; // 2-5km for same district
      }
      // Check for neighboring districts
      else if (lowerAddr.includes('quận') || lowerAddr.includes('phường')) {
        distanceKm = 5 + Math.random() * 10; // 5-15km for within city
      }
      // Check for provinces
      else if (vietnamLocations[lowerAddr] || Object.keys(vietnamLocations).some(loc => lowerAddr.includes(loc))) {
        distanceKm = 15 + Math.random() * 35; // 15-50km for different areas
      }
      // Default for unknown locations
      else {
        distanceKm = 10 + Math.random() * 20; // 10-30km default
      }
      
      distanceKm = Math.round(distanceKm * 10) / 10;
      source = 'fallback';
      if (!debugInfo) debugInfo = {};
      debugInfo.fallback_reason = 'estimated_by_keywords';
    }

    // Compute shipping fee
    const shippingFee = distanceKm <= freeRadiusKm ? 0 : Math.round(distanceKm * feePerKm);

    const response: any = {
      success: true,
      data: {
        distance_km: distanceKm,
        free_radius_km: freeRadiusKm,
        shipping_fee: shippingFee,
        source,
        fee_per_km: feePerKm,
        store_location: hasStoreCoords ? { lat: storeLat, lng: storeLng } : null,
      },
    };

    // Add debug info if requested
    if (req.query.debug === '1') {
      response.debug = {
        ...debugInfo,
        google_maps_key_configured: hasKey,
        store_coords_configured: hasStoreCoords,
        address_provided: address,
        calculation_method: source,
      };
    }

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('Calc distance API error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi khi tính khoảng cách/phí ship' });
  }
}

