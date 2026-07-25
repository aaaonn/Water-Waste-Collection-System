/// Utility for handling Thai date mappings and size key mapping
class ThaiDateUtils {
  static const Map<String, int> kThaiMonthMap = {
    'มกราคม': 1,
    'กุมภาพันธ์': 2,
    'มีนาคม': 3,
    'เมษายน': 4,
    'พฤษภาคม': 5,
    'มิถุนายน': 6,
    'กรกฎาคม': 7,
    'สิงหาคม': 8,
    'กันยายน': 9,
    'ตุลาคม': 10,
    'พฤศจิกายน': 11,
    'ธันวาคม': 12,
  };

  /// Maps garbage size names like "ถังขยะ 20L" to a standard key "20L"
  static String mapSizeKey(String sizeName) {
    if (sizeName.contains('100') || sizeName.contains('120')) return '120L';
    if (sizeName.contains('50') || sizeName.contains('60')) return '60L';
    if (sizeName.contains('20')) return '20L';
    return sizeName;
  }
}
